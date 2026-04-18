package project.auth_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import project.auth_service.config.JwtProperties;
import project.auth_service.dto.refresh.RefreshResponse;
import project.auth_service.dto.login.LoginRequest;
import project.auth_service.dto.login.LoginResponse;
import project.auth_service.dto.register.RegisterResponse;
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
    private final UserClientService userClientService;
    private final JwtProperties jwtProperties;

    @Transactional
    public RegisterResponse register(String loginName, String rawPassword) {

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

        try {
            userClientService.createUser(saved);
            //TODO: Пофиксить на транзакшнл аутбокс
        } catch (Exception e) {
            log.error("Ошибка при вызове user-service: userId={}", saved.getUserId(), e);
            throw e;
        }

        log.info("Пользователь создан: userId={}, role={}", saved.getUserId(), saved.getRole());
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

            //TODO: добавить удаление всех сессий в случае повторного использования токена

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

    private String generateRefreshToken() {
        return UUID.randomUUID().toString();
    }
}