package project.auth_service.dto.register;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank
    private String loginName;

    @NotBlank
    private String password;

    @Email
    private String email;

    private String phoneNumber;
}
