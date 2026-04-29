package project.user_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.user_service.dto.BaseResponse;
import project.user_service.dto.user.CreateUserRequest;
import project.user_service.dto.user.UpdateUserRequest;
import project.user_service.dto.user.UserResponse;
import project.user_service.security.UserPrincipal;
import project.user_service.service.UserService;

import java.util.UUID;

@RestController
@RequestMapping("/v1/users")
@RequiredArgsConstructor
@Tag(name = "Пользователи", description = "Операции с пользователями")
public class UserController {

    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('SYSTEM')")
    @Operation(summary = "Создать пользователя (internal)")
    public BaseResponse<UserResponse> createUser(
            @RequestBody @Valid CreateUserRequest request
    ) {

        UserResponse user = userService.createUser(request);

        return BaseResponse.<UserResponse>builder()
                .data(user)
                .message("Пользователь создан")
                .build();
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @Operation(summary = "Получить текущего пользователя")
    public BaseResponse<UserResponse> me(
            @AuthenticationPrincipal UserPrincipal principal
    ) {

        UserResponse user = userService.getById(principal.getUserId());

        return BaseResponse.<UserResponse>builder()
                .data(user)
                .message("Текущий пользователь")
                .build();
    }

    @GetMapping("/{nickname}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @Operation(summary = "Получить пользователя по nickname")
    public BaseResponse<UserResponse> getUser(@PathVariable String nickname) {

        UserResponse user = userService.getByNickname(nickname);

        return BaseResponse.<UserResponse>builder()
                .data(user)
                .message("Пользователь найден")
                .build();
    }

    @PutMapping("/me")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @Operation(summary = "Обновить текущего пользователя")
    public BaseResponse<UserResponse> updateMe(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateUserRequest request
    ) {

        UserResponse user = userService.update(principal.getUserId(), request);

        return BaseResponse.<UserResponse>builder()
                .data(user)
                .message("Пользователь обновлён")
                .build();
    }

    //TODO: подумать о смысле этого ендпоинта для админа или удалить его
    @PutMapping("/{id}")
    @Operation(summary = "Обновить пользователя по ID")
    public BaseResponse<UserResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request
    ) {

        UserResponse user = userService.update(id, request);

        return BaseResponse.<UserResponse>builder()
                .data(user)
                .message("Пользователь обновлён")
                .build();
    }

    //TODO: перевести метод в удаление ME и подумать о способе удаления:
    // колонка deleted в user для будущего восстановления или удаления окончательно
    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить пользователя")
    public BaseResponse<Void> delete(@PathVariable UUID id) {

        userService.delete(id);

        return BaseResponse.<Void>builder()
                .message("Пользователь удалён")
                .build();
    }

}
