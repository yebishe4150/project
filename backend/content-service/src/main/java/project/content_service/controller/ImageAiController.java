package project.content_service.controller;

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
import org.springframework.web.bind.annotation.*;
import project.content_service.dto.ErrorResponse;
import project.content_service.dto.imagegenerator.GenerateImageRequest;
import project.content_service.dto.imagegenerator.GenerateImageResponse;
import project.content_service.dto.imagegenerator.GenerateImageResponseWrapper;
import project.content_service.security.UserPrincipal;
import project.content_service.service.ImageAiService;

@RestController
@RequestMapping("/v1/content/ai")
@RequiredArgsConstructor
public class ImageAiController {

    private final ImageAiService imageAiService;

    @Operation(summary = "Генерация изображения")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Изображение успешно сгенерировано",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = GenerateImageResponseWrapper.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Ошибка генерации изображения",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    @PreAuthorize("hasRole('USER')")
    @PostMapping("/generate")
    public GenerateImageResponseWrapper generate(
            @RequestBody @Valid GenerateImageRequest request,
            @AuthenticationPrincipal UserPrincipal user
    ) {

        GenerateImageResponse response = imageAiService.generate(request, user.getUserId());

        return GenerateImageResponseWrapper.builder()
                .data(response)
                .message("Изображение успешно сгенерировано")
                .build();
    }
}
