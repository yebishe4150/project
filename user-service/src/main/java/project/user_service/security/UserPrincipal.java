package project.user_service.security;

import lombok.AllArgsConstructor;
import lombok.Getter;
import project.user_service.entity.Role;

import java.util.UUID;

@Getter
@AllArgsConstructor
public class UserPrincipal {

    private UUID userId;
    private Role role;
}