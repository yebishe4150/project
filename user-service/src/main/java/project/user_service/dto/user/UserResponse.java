package project.user_service.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
@Schema(description = "Ответ с данными пользователя")
public class UserResponse {

    @Schema(example = "550e8400-e29b-41d4-a716-446655440000", description = "ID пользователя")
    private UUID id;

    @Schema(example = "test_login", description = "Логин пользователя")
    private String loginName;

    @Schema(example = "Максим", description = "Имя пользователя")
    private String name;
}