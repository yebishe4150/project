package project.user_service.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
@Schema(description = "Запрос на обновление пользователя")
public class UpdateUserRequest {

    @Schema(example = "Максим", description = "Имя пользователя")
    private String firstName;

    private String secondName;

    private String nickname;

    @Email
    private String email;

    private String phoneNumber;
}
