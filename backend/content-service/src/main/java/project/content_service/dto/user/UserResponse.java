package project.content_service.dto.user;

import lombok.Data;

import java.util.UUID;

@Data
public class UserResponse {

    private UUID id;
    private String nickname;
}
