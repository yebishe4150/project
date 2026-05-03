package project.auth_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.auth_service.dto.ErrorResponse;
import project.auth_service.dto.password.ChangePasswordRequest;
import project.auth_service.dto.password.ChangePasswordResponse;
import project.auth_service.dto.password.ChangePasswordResponseWrapper;
import project.auth_service.security.UserPrincipal;
import project.auth_service.service.AuthService;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
public class PasswordController {

    private static final String REFRESH_COOKIE = "refreshToken";

    private final AuthService authService;

    @Operation(summary = "Смена пароля")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Пароль изменён",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ChangePasswordResponseWrapper.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Ошибка валидации",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Пользователь не авторизован или передан некорректный пароль",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Недостаточно прав",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @PostMapping("/change-password")
    public ChangePasswordResponseWrapper changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken,
            @RequestBody @Valid ChangePasswordRequest request
    ) {

        String accessToken = authService.changePassword(
                principal.getUserId(),
                request.getCurrentPassword(),
                request.getNewPassword(),
                refreshToken
        );

        return ChangePasswordResponseWrapper.builder()
                .data(ChangePasswordResponse.builder()
                        .accessToken(accessToken)
                        .build())
                .message("Пароль изменён")
                .build();
    }
}
