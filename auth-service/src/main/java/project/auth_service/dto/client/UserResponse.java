package project.auth_service.dto.client;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.UUID;

@Data
@Schema(description = "Данные пользователя")
public class UserResponse {

    @Schema(description = "ID пользователя", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;

    @Schema(description = "Логин", example = "test_login")
    private String loginName;

    @Schema(description = "Имя", example = "Максим")
    private String name;
}