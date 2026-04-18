package project.auth_service.dto.register;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegisterResponse {
    private String loginName;
}