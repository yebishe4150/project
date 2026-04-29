package project.content_service.service;

import feign.FeignException;
import feign.RetryableException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import project.content_service.client.UserClient;
import project.content_service.dto.BaseResponse;
import project.content_service.dto.user.UserResponse;
import project.content_service.exception.ExternalServiceException;
import project.content_service.exception.NotFoundException;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserClientService {

    private final UserClient userClient;

    public UUID getUserIdByNickname(String nickname, String authorizationHeader) {
        try {
            BaseResponse<UserResponse> response = userClient.getUserByNickname(nickname, authorizationHeader);

            if (response == null || response.getData() == null || response.getData().getId() == null) {
                log.error("Пустой ответ от user-service при поиске пользователя по nickname: nickname={}", nickname);
                throw new ExternalServiceException("user-service вернул пустой ответ");
            }

            return response.getData().getId();
        } catch (RetryableException ex) {
            log.warn("user-service недоступен (timeout) при поиске пользователя по nickname: nickname={}", nickname);
            throw new ExternalServiceException("user-service недоступен (timeout)", ex);
        } catch (FeignException.NotFound ex) {
            log.warn("Пользователь не найден в user-service при поиске по nickname: nickname={}", nickname);
            throw new NotFoundException("Пользователь не найден");
        } catch (FeignException ex) {
            log.warn("Ошибка user-service при поиске пользователя по nickname: status={}, nickname={}", ex.status(), nickname);
            throw new ExternalServiceException(
                    "user-service вернул ошибку при поиске пользователя по nickname: status=" + ex.status(), ex
            );
        }
    }
}
