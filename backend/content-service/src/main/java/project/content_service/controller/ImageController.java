package project.content_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import project.content_service.dto.ErrorResponse;
import project.content_service.dto.ImageListResponseWrapper;
import project.content_service.dto.image.ImageResponse;
import project.content_service.dto.upload.ImageUploadResponseWrapper;
import project.content_service.dto.upload.UploadImageRequest;
import project.content_service.dto.upload.UploadImageResponse;
import project.content_service.dto.userimage.UserImageListResponseWrapper;
import project.content_service.dto.userimage.UserImageResponse;
import project.content_service.security.UserPrincipal;
import project.content_service.service.ImageService;

import java.util.List;

@RestController
@RequestMapping("/v1/content")
@RequiredArgsConstructor
@Tag(name = "Изображения", description = "Операции загрузки и получения изображений")
public class ImageController {

    private final ImageService service;

    @Operation(summary = "Загрузка изображения")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Изображение успешно загружено",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ImageUploadResponseWrapper.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Ошибка загрузки файла",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    @PreAuthorize("hasRole('USER')")
    @PostMapping(path = "images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImageUploadResponseWrapper upload(
            @RequestPart("file") MultipartFile file,
            @Valid @ModelAttribute UploadImageRequest request,
            @AuthenticationPrincipal UserPrincipal user
    ) {

        UploadImageResponse response = service.upload(
                file,
                user.getUserId(),
                request
        );

        return ImageUploadResponseWrapper.builder()
                .data(response)
                .message("Изображение успешно загружено")
                .build();
    }

    @Operation(summary = "Получить все изображения")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Список изображений",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ImageListResponseWrapper.class)
                    )
            )
    })
    @GetMapping
    public ImageListResponseWrapper getAll() {

        List<ImageResponse> response = service.getAll();

        return ImageListResponseWrapper.builder()
                .data(response)
                .message("Список изображений")
                .build();
    }

    @Operation(summary = "Получить изображения пользователя")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Список изображений пользователя",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = UserImageListResponseWrapper.class)
                    )
            )
    })
    @PreAuthorize("hasRole('USER')")
    @GetMapping("/images/user")
    public UserImageListResponseWrapper getByUser(@AuthenticationPrincipal UserPrincipal user) {

        List<UserImageResponse> response = service.getByUser(user.getUserId());

        return UserImageListResponseWrapper.builder()
                .data(response)
                .message("Список изображений пользователя")
                .build();
    }

    @Operation(summary = "Получить загруженные изображения пользователя")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Список загруженных изображений пользователя",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = UserImageListResponseWrapper.class)
                    )
            )
    })
    @PreAuthorize("hasRole('USER')")
    @GetMapping("/images/user/uploads")
    public UserImageListResponseWrapper getUploadedByUser(@AuthenticationPrincipal UserPrincipal user) {

        List<UserImageResponse> response = service.getUploadedByUser(user.getUserId());

        return UserImageListResponseWrapper.builder()
                .data(response)
                .message("Список загруженных изображений пользователя")
                .build();
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping("/images/users/{nickname}/uploads")
    public UserImageListResponseWrapper getUploadedByUserNickname(
            @PathVariable String nickname,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader
    ) {

        List<UserImageResponse> response = service.getUploadedByUserNickname(nickname, authorizationHeader);

        return UserImageListResponseWrapper.builder()
                .data(response)
                .message("Список загруженных изображений пользователя")
                .build();
    }

    @Operation(summary = "Получить сгенерированные изображения пользователя")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Список сгенерированных изображений пользователя",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = UserImageListResponseWrapper.class)
                    )
            )
    })
    @PreAuthorize("hasRole('USER')")
    @GetMapping("/images/user/generated")
    public UserImageListResponseWrapper getGeneratedByUser(@AuthenticationPrincipal UserPrincipal user) {

        List<UserImageResponse> response = service.getGeneratedByUser(user.getUserId());

        return UserImageListResponseWrapper.builder()
                .data(response)
                .message("Список сгенерированных изображений пользователя")
                .build();
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping("/images/users/{nickname}/generated")
    public UserImageListResponseWrapper getGeneratedByUserNickname(
            @PathVariable String nickname,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader
    ) {

        List<UserImageResponse> response = service.getGeneratedByUserNickname(nickname, authorizationHeader);

        return UserImageListResponseWrapper.builder()
                .data(response)
                .message("Список сгенерированных изображений пользователя")
                .build();
    }

    @Operation(summary = "Поиск изображений по тегам")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Результаты поиска",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ImageListResponseWrapper.class)
                    )
            )
    })
    @GetMapping("/search")
    public ImageListResponseWrapper searchByTags(
            @RequestParam(required = false) List<String> tags
    ) {
        List<ImageResponse> response = service.searchByTags(tags);

        return ImageListResponseWrapper.builder()
                .data(response)
                .message("Поиск по тегам")
                .build();
    }
}
