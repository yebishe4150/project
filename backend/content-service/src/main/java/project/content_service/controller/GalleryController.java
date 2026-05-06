package project.content_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.content_service.dto.gallery.GalleryImageResponse;
import project.content_service.dto.gallery.GalleryImagesResponseWrapper;
import project.content_service.dto.gallery.GalleryTagResponse;
import project.content_service.dto.gallery.GalleryTagsResponseWrapper;
import project.content_service.service.GalleryService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/content/gallery")
@RequiredArgsConstructor
@Tag(name = "Галерея", description = "Операции с категориями галереи")
public class GalleryController {

    private final GalleryService galleryService;

    @Operation(summary = "Получить категории галереи")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Категории галереи",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = GalleryTagsResponseWrapper.class)
                    )
            )
    })
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping("/tags")
    public GalleryTagsResponseWrapper getTags() {

        List<GalleryTagResponse> response = galleryService.getTags();

        return GalleryTagsResponseWrapper.builder()
                .data(response)
                .message("Категории галереи")
                .build();
    }

    @Operation(summary = "Получить изображения категории галереи")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Изображения категории галереи",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = GalleryImagesResponseWrapper.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Тег не найден",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = project.content_service.dto.ErrorResponse.class)
                    )
            )
    })
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping("/tags/{tagId}/images")
    public GalleryImagesResponseWrapper getImagesByTag(@PathVariable UUID tagId) {

        List<GalleryImageResponse> response = galleryService.getImagesByTag(tagId);

        return GalleryImagesResponseWrapper.builder()
                .data(response)
                .message("Изображения категории галереи")
                .build();
    }
}
