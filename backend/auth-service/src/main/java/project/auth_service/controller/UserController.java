package project.auth_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import project.auth_service.dto.BaseResponse;
import project.auth_service.dto.client.UserResponse;
import project.auth_service.security.UserPrincipal;
import project.auth_service.service.UserClientService;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserClientService userClientService;

    @GetMapping("/v1/auth/me")
    public BaseResponse<UserResponse> me(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        UserResponse user =
                userClientService.getUser(principal.getUserId());

        return BaseResponse.<UserResponse>builder()
                .data(user)
                .message("Текущий пользователь")
                .build();
    }
}