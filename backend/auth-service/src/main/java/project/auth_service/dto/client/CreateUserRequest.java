package project.auth_service.dto.client;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
@Schema(description = "Запрос на создание пользователя для user-service")
public class CreateUserRequest {

    @NotNull(message = "ID пользователя обязателен")
    @Schema(description = "ID пользователя из auth-service", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;

    @NotBlank(message = "Логин не должен быть пустым")
    @Schema(description = "Логин пользователя", example = "test_login")
    private String loginName;

    private String email;

    private String phoneNumber;

    public static CreateUserRequest from(UUID id, String loginName) {
        CreateUserRequest request = new CreateUserRequest();
        request.setId(id);
        request.setLoginName(loginName);
        return request;
    }
}
