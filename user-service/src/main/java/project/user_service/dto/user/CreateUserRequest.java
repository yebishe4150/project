package project.user_service.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
@Schema(description = "Запрос на создание пользователя")
public class CreateUserRequest {

    @NotNull(message = "ID пользователя обязателен")
    @Schema(example = "550e8400-e29b-41d4-a716-446655440000", description = "ID пользователя (приходит из auth-service)")
    private UUID id;

    @NotBlank(message = "Логин не должен быть пустым")
    @Schema(example = "test_login", description = "Логин пользователя")
    private String loginName;

    @Schema(example = "Максим", description = "Имя пользователя")
    private String name;
}