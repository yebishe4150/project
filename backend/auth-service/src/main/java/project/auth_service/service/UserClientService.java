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

@Slf4j
@Service
@RequiredArgsConstructor
public class UserClientService {

    private final UserClient userClient;

    public void createUser(UserCredentials user, String email, String phoneNumber) {

        CreateUserRequest request = new CreateUserRequest();
        request.setId(user.getUserId());
        request.setLoginName(user.getLoginName());
        request.setEmail(email);
        request.setPhoneNumber(phoneNumber);

        try {
            BaseResponse<UserResponse> response = userClient.createUser(request);

            if (response == null || response.getData() == null) {
                log.error("Пустой ответ от user-service при создании пользователя: userId={}", user.getUserId());
                throw new ExternalServiceException("user-service вернул пустой ответ при создании пользователя");
            }

        } catch (RetryableException ex) {
            log.warn("user-service недоступен (timeout) при создании пользователя: userId={}", user.getUserId());
            throw new ExternalServiceException("user-service недоступен (timeout)", ex);

        } catch (FeignException ex) {
            log.warn("Ошибка user-service при создании пользователя: status={}, userId={}",
                    ex.status(), user.getUserId());
            throw new ExternalServiceException(
                    "user-service вернул ошибку при создании пользователя: status=" + ex.status(), ex
            );
        }
    }
}
