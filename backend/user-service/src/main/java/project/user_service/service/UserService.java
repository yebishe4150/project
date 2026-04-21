package project.user_service.service;

import lombok.RequiredArgsConstructor;
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

import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Consumer;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final String NICKNAME_PREFIX = "good_user_";
    private static final int MIN_NICKNAME_NUMBER = 1;
    private static final int MAX_NICKNAME_NUMBER = 123_123;

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public UserResponse getById(UUID id) {
        return userMapper.toResponse(
                userRepository.findById(id)
                        .orElseThrow(() -> new NotFoundException("Пользователь не найден"))
        );
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {

        if (userRepository.existsById(request.getId())) {
            throw new UserAlreadyExistsException("Пользователь уже существует");
        }

        User user = userMapper.toEntity(request);
        user.setNickname(generateUniqueNickname());

        user = userRepository.save(user);

        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse update(UUID id, UpdateUserRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        applyIfNotEmpty(request.getFirstName(), user::setFirstName);
        applyIfNotEmpty(request.getSecondName(), user::setSecondName);
        applyIfNotEmpty(request.getNickname(), user::setNickname);
        applyIfNotEmpty(request.getEmail(), user::setEmail);
        applyIfNotEmpty(request.getPhoneNumber(), user::setPhoneNumber);

        User saved = userRepository.save(user);

        return userMapper.toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        userRepository.delete(user);
    }

    private void applyIfNotEmpty(String value, Consumer<String> setter) {
        if (value != null && !value.trim().isEmpty()) {
            setter.accept(value);
        }
    }

    private String generateUniqueNickname() {
        for (int attempt = 0; attempt < MAX_NICKNAME_NUMBER; attempt++) {
            String nickname = NICKNAME_PREFIX + ThreadLocalRandom.current()
                    .nextInt(MIN_NICKNAME_NUMBER, MAX_NICKNAME_NUMBER + 1);

            if (!userRepository.existsByNickname(nickname)) {
                return nickname;
            }
        }

        throw new UserAlreadyExistsException("РќРµ СѓРґР°Р»РѕСЃСЊ СЃРіРµРЅРµСЂРёСЂРѕРІР°С‚СЊ СѓРЅРёРєР°Р»СЊРЅС‹Р№ nickname");
    }
}
