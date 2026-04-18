package project.user_service.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Запрос на обновление пользователя")
public class UpdateUserRequest {

    @NotBlank(message = "Имя не должно быть пустым")
    @Schema(example = "Максим", description = "Имя пользователя")
    private String name;
}
