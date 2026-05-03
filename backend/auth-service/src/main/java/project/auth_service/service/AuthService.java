package project.auth_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.auth_service.config.JwtProperties;
import project.auth_service.dto.login.LoginRequest;
import project.auth_service.dto.login.LoginResponse;
import project.auth_service.dto.refresh.RefreshResponse;
import project.auth_service.dto.register.RegisterResponse;
import project.auth_service.dto.client.CreateUserRequest;
import project.auth_service.entity.RefreshToken;
import project.auth_service.entity.Role;
import project.auth_service.entity.UserCredentials;
import project.auth_service.exception.InvalidCredentialsException;
import project.auth_service.exception.TokenException;
import project.auth_service.exception.UserAlreadyExistsException;
import project.auth_service.repository.RefreshTokenRepository;
import project.auth_service.repository.UserCredentialsRepository;
import project.auth_service.validation.PasswordValidator;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserCredentialsRepository userCredentialsRepository;
    private final RefreshTokenRepository refreshRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserSyncService userSyncService;
    private final JwtProperties jwtProperties;
    private final RefreshSessionRevocationService refreshSessionRevocationService;

    @Transactional
    public RegisterResponse register(String loginName, String rawPassword, String email, String phoneNumber) {

        PasswordValidator.validate(rawPassword);

        if (userCredentialsRepository.findByLoginName(loginName).isPresent()) {
            throw new UserAlreadyExistsException("Пользователь уже существует");
        }

        UserCredentials user = UserCredentials.builder()
                .loginName(loginName)
                .password(passwordEncoder.encode(rawPassword))
                .role(Role.USER)
                .build();

        UserCredentials saved;

        try {
            saved = userCredentialsRepository.save(user);
        } catch (DataIntegrityViolationException e) {
            throw new UserAlreadyExistsException("Пользователь уже существует");
        }

        userSyncService.schedule(saved);
        log.info("Пользователь сохранён в auth-service и поставлен в очередь синхронизации: userId={}, role={}",
                saved.getUserId(), saved.getRole());

        CreateUserRequest createUserRequest = new CreateUserRequest();
        createUserRequest.setId(saved.getUserId());
        createUserRequest.setLoginName(saved.getLoginName());
        createUserRequest.setEmail(email);
        createUserRequest.setPhoneNumber(phoneNumber);

        userSyncService.trySyncNow(createUserRequest);

        return RegisterResponse.builder()
                .loginName(saved.getLoginName())
                .build();
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {

        UserCredentials user = userCredentialsRepository
                .findByLoginName(request.getLoginName())
                .orElseThrow(() -> {
                    log.warn("Неудачная попытка входа: loginName={}", request.getLoginName());
                    return new InvalidCredentialsException("Неверный логин или пароль");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Неудачная попытка входа (пароль): userId={}", user.getUserId());
            throw new InvalidCredentialsException("Неверный логин или пароль");
        }

        refreshRepo.deleteAllByUserId(user.getUserId());
        String accessToken = jwtService.generateToken(user.getUserId(), user.getRole());
        String refreshToken = generateRefreshToken();

        refreshRepo.save(
                RefreshToken.builder()
                        .userId(user.getUserId())
                        .token(refreshToken)
                        .expiresAt(LocalDateTime.now().plusSeconds(jwtProperties.getRefreshTokenExpiration()))
                        .used(false)
                        .build()
        );
        log.info("Пользователь успешно залогинился: userId={}", user.getUserId());
        return LoginResponse.builder()
                .userId(user.getUserId())
                .role(user.getRole().name())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    @Transactional
    public RefreshResponse refresh(String refreshToken) {

        RefreshToken token = refreshRepo.findByToken(refreshToken)
                .orElseThrow(() -> new TokenException("Некорректный refresh token"));

        UUID userId = token.getUserId();

        UserCredentials user = userCredentialsRepository.findById(userId)
                .orElseThrow(() -> new TokenException("Пользователь не найден"));

        if (token.isUsed()) {
            refreshSessionRevocationService.revokeAllExceptCurrent(userId, refreshToken);
            log.warn("Повторное использование refresh token");
            throw new TokenException("Refresh token already used");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("Просроченный refresh token: userId={}", userId);
            throw new TokenException("Срок действия refresh token истёк");
        }

        token.setUsed(true);
        refreshRepo.save(token);

        String newAccessToken = jwtService.generateToken(
                user.getUserId(),
                user.getRole()
        );

        String newRefreshToken = generateRefreshToken();

        refreshRepo.save(
                RefreshToken.builder()
                        .userId(user.getUserId())
                        .token(newRefreshToken)
                        .expiresAt(LocalDateTime.now().plusSeconds(jwtProperties.getRefreshTokenExpiration()))
                        .used(false)
                        .build()
        );
        log.info("Успешное обновление токена: userId={}", user.getUserId());
        return RefreshResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    @Transactional
    public void logout(String refreshToken) {

        UUID userId = refreshRepo.findByToken(refreshToken)
                .orElseThrow(() -> new TokenException("Некорректный refresh token"))
                .getUserId();

        refreshRepo.deleteAllByUserId(userId);

        log.info("Пользователь вышел: userId={}", userId);
    }

    @Transactional
    public String changePassword(UUID userId, String currentPassword, String newPassword, String currentRefreshToken) {

        PasswordValidator.validate(newPassword);

        if (currentRefreshToken == null) {
            throw new TokenException("Refresh token отсутствует");
        }

        UserCredentials user = userCredentialsRepository.findById(userId)
                .orElseThrow(() -> new InvalidCredentialsException("Учетные данные пользователя не найдены"));

        RefreshToken refreshToken = refreshRepo.findByToken(currentRefreshToken)
                .orElseThrow(() -> new TokenException("Некорректный refresh token"));

        if (!refreshToken.getUserId().equals(userId) || refreshToken.isUsed()) {
            throw new TokenException("Некорректный refresh token");
        }

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new TokenException("Срок действия refresh token истёк");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            log.warn("Смена пароля отклонена: userId={}", userId);
            throw new InvalidCredentialsException("Неверный текущий пароль");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userCredentialsRepository.save(user);
        refreshRepo.deleteAllByUserIdAndTokenNot(userId, currentRefreshToken);

        log.info("Пароль изменён: userId={}", userId);

        return jwtService.generateToken(user.getUserId(), user.getRole());
    }

    private String generateRefreshToken() {
        return UUID.randomUUID().toString();
    }
}
