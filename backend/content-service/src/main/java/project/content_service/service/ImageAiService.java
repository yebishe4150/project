package project.content_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.content_service.client.PollinationsImageClient;
import project.content_service.dto.image.ImageResponse;
import project.content_service.dto.imagegenerator.GenerateImageRequest;
import project.content_service.dto.imagegenerator.GenerateImageResponse;
import project.content_service.util.UrlRewriter;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ImageAiService {

    private final PollinationsImageClient aiClient;
    private final PromptService promptService;
    private final ImageStorageService imageStorageService;
    private final UrlRewriter urlRewriter;

    @Transactional
    public GenerateImageResponse generate(GenerateImageRequest request, UUID userId) {

        String finalPrompt = promptService.preparePrompt(request.getPrompt());

        byte[] imageBytes = aiClient.generateImage(finalPrompt);

        ImageResponse image = imageStorageService.save(
                imageBytes,
                "image/jpeg",
                "ai_" + System.currentTimeMillis() + ".jpg",
                userId,
                request.getDescription(),
                request.getTags()
        );

        return GenerateImageResponse.builder()
                .url(urlRewriter.rewriteForExternalAccess(image.getUrl()))
                .build();
    }
}
