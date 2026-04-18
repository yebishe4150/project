package project.auth_service.dto.refresh;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;

@Data
public class RefreshRequest {

    @NotBlank(message = "Refresh token must not be empty")
    private String refreshToken;
}
