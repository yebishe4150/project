package project.auth_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.auth_service.dto.BaseResponse;
import project.auth_service.dto.ErrorResponse;
import project.auth_service.dto.login.LoginRequest;
import project.auth_service.dto.login.LoginResponse;
import project.auth_service.dto.login.LoginResponseWrapper;
import project.auth_service.dto.refresh.RefreshResponse;
import project.auth_service.dto.refresh.RefreshResponseWrapper;
import project.auth_service.dto.register.RegisterRequest;
import project.auth_service.dto.register.RegisterResponse;
import project.auth_service.dto.register.RegisterResponseWrapper;
import project.auth_service.exception.TokenException;
import project.auth_service.service.AuthService;
import project.auth_service.service.CookieService;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CookieService cookieService;

    private static final String REFRESH_COOKIE = "refreshToken";

    @Operation(summary = "Регистрация пользователя")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Пользователь успешно зарегистрирован",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = RegisterResponseWrapper.class)
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
                    responseCode = "409",
                    description = "Пользователь уже существует",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    @PostMapping("/register")
    public BaseResponse<RegisterResponse> register(@RequestBody @Valid RegisterRequest request) {

        RegisterResponse response = authService.register(
                request.getLoginName(),
                request.getPassword()
        );

        return RegisterResponseWrapper.builder()
                .data(response)
                .message("Пользователь успешно зарегистрирован")
                .build();
    }

    @Operation(summary = "Вход в систему")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Успешный вход",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = LoginResponseWrapper.class)
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
                    description = "Неверный логин или пароль",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    @PostMapping("/login")
    public BaseResponse<LoginResponse> login(
            @RequestBody @Valid LoginRequest request,
            HttpServletResponse response
    ) {

        LoginResponse loginResponse = authService.login(request);

        cookieService.addRefreshCookie(response, loginResponse.getRefreshToken());

        LoginResponse safeResponse = LoginResponse.builder()
                .userId(loginResponse.getUserId())
                .role(loginResponse.getRole())
                .accessToken(loginResponse.getAccessToken())
                .refreshToken(null)
                .build();

        return LoginResponseWrapper.builder()
                .data(safeResponse)
                .message("Успешный вход")
                .build();
    }

    @Operation(summary = "Обновление access токена")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Токен успешно обновлён",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = RefreshResponseWrapper.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Refresh token отсутствует или невалиден",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    @PostMapping("/refresh")
    public BaseResponse<RefreshResponse> refresh(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken,
            HttpServletResponse response
    ) {

        if (refreshToken == null) {
            throw new TokenException("Refresh token отсутствует");
        }

        RefreshResponse refreshResponse = authService.refresh(refreshToken);

        cookieService.addRefreshCookie(response, refreshResponse.getRefreshToken());

        RefreshResponse safeResponse = RefreshResponse.builder()
                .accessToken(refreshResponse.getAccessToken())
                .refreshToken(null)
                .build();

        return RefreshResponseWrapper.builder()
                .data(safeResponse)
                .message("Токен обновлён")
                .build();
    }

    @PostMapping("/logout")
    public BaseResponse<Void> logout(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken,
            HttpServletResponse response
    ) {

        if (refreshToken != null) {
            authService.logout(refreshToken);
        }
        cookieService.clearRefreshCookie(response);

        return BaseResponse.<Void>builder()
                .message("Выход выполнен")
                .build();
    }

}