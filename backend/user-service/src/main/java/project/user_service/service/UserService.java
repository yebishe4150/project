package project.user_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.user_service.dto.user.CreateUserRequest;
import project.user_service.dto.user.UpdateUserRequest;
import project.user_service.dto.user.UserResponse;
import project.user_service.entity.User;
import project.user_service.exception.NotFoundException;
import project.user_service.exception.UserAlreadyExistsException;
import project.user_service.repository.UserRepository;
import project.user_service.service.mapper.UserMapper;
import project.user_service.validation.NicknameValidator;

import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Consumer;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private static final String NICKNAME_PREFIX = "good_user_";
    private static final int MIN_NICKNAME_NUMBER = 1;
    private static final int MAX_NICKNAME_NUMBER = 123_123;

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public UserResponse getById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        return userMapper.toResponse(user);
    }

    public UserResponse getByNickname(String nickname) {
        User user = userRepository.findByNickname(normalizeNickname(nickname))
                .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {

        if (userRepository.existsById(request.getId())) {
            throw new UserAlreadyExistsException("Пользователь уже существует");
        }

        User user = userMapper.toEntity(request);
        user.setNickname(generateUniqueNickname());

        user = userRepository.save(user);

        log.info("Пользователь создан в user-service: userId={}, loginName={}", user.getId(), user.getLoginName());

        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse update(UUID id, UpdateUserRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        String normalizedNickname = normalizeNickname(request.getNickname());
        NicknameValidator.validate(normalizedNickname);

        if (hasNicknameConflict(user, normalizedNickname)) {
            throw new UserAlreadyExistsException("Никнейм уже занят");
        }

        applyIfNotEmpty(request.getFirstName(), user::setFirstName);
        applyIfNotEmpty(request.getSecondName(), user::setSecondName);
        applyIfNotEmpty(normalizedNickname, user::setNickname);
        applyIfNotEmpty(request.getEmail(), user::setEmail);
        applyIfNotEmpty(request.getPhoneNumber(), user::setPhoneNumber);

        try {
            User saved = userRepository.saveAndFlush(user);
            log.info("Пользователь обновлён: userId={}", saved.getId());
            return userMapper.toResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new UserAlreadyExistsException("Никнейм уже занят");
        }
    }

    @Transactional
    public void delete(UUID id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        userRepository.delete(user);
        log.info("Пользователь удалён: userId={}", id);
    }

    private boolean hasNicknameConflict(User user, String normalizedRequestedNickname) {
        if (normalizedRequestedNickname == null || normalizedRequestedNickname.isEmpty()) {
            return false;
        }

        String currentNickname = normalizeNickname(user.getNickname());

        if (normalizedRequestedNickname.equals(currentNickname)) {
            return false;
        }

        return userRepository.existsByNickname(normalizedRequestedNickname);
    }

    private void applyIfNotEmpty(String value, Consumer<String> setter) {
        if (value != null && !value.trim().isEmpty()) {
            setter.accept(value);
        }
    }

    private String normalizeNickname(String nickname) {
        return nickname == null ? null : nickname.trim().toLowerCase(Locale.ROOT);
    }

    private String generateUniqueNickname() {
        for (int attempt = 0; attempt < MAX_NICKNAME_NUMBER; attempt++) {
            String nickname = NICKNAME_PREFIX + ThreadLocalRandom.current()
                    .nextInt(MIN_NICKNAME_NUMBER, MAX_NICKNAME_NUMBER + 1);

            if (!userRepository.existsByNickname(nickname)) {
                return nickname;
            }
        }

        throw new UserAlreadyExistsException("Не удалось сгенерировать уникальный nickname");
    }
}
