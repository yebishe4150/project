package project.content_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import project.content_service.dto.imagegenerator.GenerateImageRequest;
import project.content_service.dto.imagegenerator.GenerateImageResponse;
import project.content_service.security.UserPrincipal;
import project.content_service.service.ImageService;

@RestController
@RequestMapping("/v1/content/ai")
@RequiredArgsConstructor
public class ImageAiController {

    private final ImageService imageService;

    @PostMapping("/generate")
    public GenerateImageResponse generate(
            @RequestBody @Valid GenerateImageRequest request,
            @AuthenticationPrincipal UserPrincipal user
    ) {

        String url = imageService.generateFromAi(
                request.getPrompt(),
                user.getUserId(),
                request.getDescription(),
                request.getTags()
        );

        return new GenerateImageResponse(url);
    }
}