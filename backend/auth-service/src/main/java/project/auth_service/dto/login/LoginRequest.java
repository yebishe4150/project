package project.auth_service.dto.login;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank
    private String loginName;

    @NotBlank
    private String password;
}
