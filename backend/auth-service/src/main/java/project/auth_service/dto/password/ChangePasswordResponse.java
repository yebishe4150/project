package project.auth_service.dto.password;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChangePasswordResponse {

    private String accessToken;
}
