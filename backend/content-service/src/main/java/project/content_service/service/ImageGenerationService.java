package project.content_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.content_service.client.PollinationsImageClient;
import project.content_service.dto.image.ImageResponse;
import project.content_service.dto.imagegenerator.GenerateImageRequest;
import project.content_service.dto.imagegenerator.GenerateImageResponse;
import project.content_service.entity.ImageSource;
import project.content_service.exception.ExternalServiceException;
import project.content_service.util.UrlRewriter;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageGenerationService {

    private final PollinationsImageClient aiClient;
    private final PromptService promptService;
    private final ImageStorageService imageStorageService;
    private final UrlRewriter urlRewriter;

    @Transactional
    public GenerateImageResponse generate(GenerateImageRequest request, UUID userId) {

        log.info("Запущена генерация изображения: userId={}", userId);

        String finalPrompt = promptService.preparePrompt(request.getPrompt());

        byte[] imageBytes;
        try {
            imageBytes = aiClient.generateImage(finalPrompt);
        } catch (Exception ex) {
            throw new ExternalServiceException("Сервис генерации изображений недоступен", ex);
        }

        ImageResponse image = imageStorageService.save(
                imageBytes,
                "image/jpeg",
                "ai_" + System.currentTimeMillis() + ".jpg",
                userId,
                request.getDescription(),
                request.getTags(),
                ImageSource.GENERATED
        );

        log.info("Изображение успешно сгенерировано: userId={}, url={}", userId, image.getUrl());

        return GenerateImageResponse.builder()
                .url(urlRewriter.rewriteForExternalAccess(image.getUrl()))
                .build();
    }
}
