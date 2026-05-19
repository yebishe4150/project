package project.content_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.content_service.dto.imagelike.ImageLikeResponse;
import project.content_service.dto.imagelike.ImageLikeResponseWrapper;
import project.content_service.security.UserPrincipal;
import project.content_service.service.ImageLikeService;

import java.util.UUID;

@RestController
@RequestMapping("/v1/content/images")
@RequiredArgsConstructor
public class ImageLikeController {

    private final ImageLikeService imageLikeService;

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{imageId}/like")
    public ImageLikeResponseWrapper like(
            @PathVariable UUID imageId,
            @AuthenticationPrincipal UserPrincipal user
    ) {
        ImageLikeResponse response = imageLikeService.like(imageId, user.getUserId());

        return ImageLikeResponseWrapper.builder()
                .data(response)
                .message("Лайк добавлен")
                .build();
    }

    @PreAuthorize("hasRole('USER')")
    @DeleteMapping("/{imageId}/like")
    public ImageLikeResponseWrapper unlike(
            @PathVariable UUID imageId,
            @AuthenticationPrincipal UserPrincipal user
    ) {
        ImageLikeResponse response = imageLikeService.unlike(imageId, user.getUserId());

        return ImageLikeResponseWrapper.builder()
                .data(response)
                .message("Лайк удалён")
                .build();
    }
}
