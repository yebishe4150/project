package project.auth_service.dto.login;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class LoginResponse {
    @NotEmpty
    @Schema(description = "JWT access token", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String accessToken;

    @NotEmpty
    @Schema(description = "Refresh token", example = "550e8400-e29b-41d4-a716-446655440000")
    private String refreshToken;

    @NotNull
    @Schema(description = "ID пользователя", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID userId;

    @NotEmpty
    @Schema(description = "Роль пользователя", example = "USER")
    private String role;
}
