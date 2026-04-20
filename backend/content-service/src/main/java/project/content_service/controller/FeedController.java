package project.content_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.content_service.dto.landingimage.LandingFeedResponseWrapper;
import project.content_service.dto.landingimage.LandingImageResponse;
import project.content_service.service.LandingFeedService;

import java.util.List;

@RestController
@RequestMapping("/v1/content")
@RequiredArgsConstructor
public class FeedController {

    private final LandingFeedService landingFeedService;

    @Operation(summary = "Публичный лендинг-фид (25 случайных изображений)")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Публичный фид",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(implementation = LandingFeedResponseWrapper.class)
                    )
            )
    })
    @GetMapping("/public/feed")
    public LandingFeedResponseWrapper getPublicFeed() {

        List<LandingImageResponse> response = landingFeedService.getFeed();

        return LandingFeedResponseWrapper.builder()
                .data(response)
                .message("Публичный фид")
                .build();
    }
}
