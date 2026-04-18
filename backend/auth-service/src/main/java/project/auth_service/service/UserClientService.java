package project.auth_service.service;

import feign.FeignException;
import feign.RetryableException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import project.auth_service.client.UserClient;
import project.auth_service.dto.BaseResponse;
import project.auth_service.dto.client.CreateUserRequest;
import project.auth_service.dto.client.UserResponse;
import project.auth_service.entity.UserCredentials;
import project.auth_service.exception.ExternalServiceException;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserClientService {

    private final UserClient userClient;

    public void createUser(UserCredentials user) {

        CreateUserRequest request = new CreateUserRequest();
        request.setId(user.getUserId());
        request.setLoginName(user.getLoginName());

        try {
            BaseResponse<UserResponse> response = userClient.createUser(request);

            if (response == null || response.getData() == null) {
                log.error("Пустой ответ от user-service при создании пользователя: userId={}", user.getUserId());
                throw new ExternalServiceException("user-service вернул пустой ответ при создании пользователя");
            }

        } catch (RetryableException ex) {
            log.error("user-service недоступен (timeout) при создании пользователя: userId={}", user.getUserId(), ex);
            throw new ExternalServiceException("user-service недоступен (timeout)", ex);

        } catch (FeignException ex) {
            log.error("Ошибка user-service при создании пользователя: status={}, userId={}",
                    ex.status(), user.getUserId(), ex);
            throw new ExternalServiceException(
                    "user-service вернул ошибку при создании пользователя: status=" + ex.status(), ex
            );
        }
    }

    public UserResponse getUser(UUID userId) {

        try {
            BaseResponse<UserResponse> response = userClient.getUser(userId);

            if (response == null || response.getData() == null) {
                log.error("Пустой ответ от user-service при получении пользователя: userId={}", userId);
                throw new ExternalServiceException("user-service вернул пустой ответ при получении пользователя");
            }

            return response.getData();

        } catch (RetryableException ex) {
            log.error("user-service недоступен (timeout) при получении пользователя: userId={}", userId, ex);
            throw new ExternalServiceException("user-service недоступен (timeout)", ex);

        } catch (FeignException ex) {
            log.error("Ошибка user-service при получении пользователя: status={}, userId={}",
                    ex.status(), userId, ex);
            throw new ExternalServiceException(
                    "user-service вернул ошибку при получении пользователя: status=" + ex.status(), ex
            );
        }
    }
}