package project.content_service.security;

import lombok.AllArgsConstructor;
import lombok.Getter;
import project.content_service.entity.Role;

import java.util.UUID;

@Getter
@AllArgsConstructor
public class UserPrincipal {

    private UUID userId;
    private Role role;
}