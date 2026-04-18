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

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

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

        user = userRepository.save(user);

        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse update(UUID id, UpdateUserRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        userMapper.updateUserFromDto(request, user);

        User saved = userRepository.save(user);

        return userMapper.toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Пользователь не найден"));

        userRepository.delete(user);
    }
}