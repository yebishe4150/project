package project.content_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import project.content_service.dto.image.ImageResponse;
import project.content_service.dto.upload.UploadImageRequest;
import project.content_service.dto.upload.UploadImageResponse;
import project.content_service.dto.userimage.UserImageResponse;
import project.content_service.entity.Image;
import project.content_service.entity.ImageSource;
import project.content_service.exception.FileUploadException;
import project.content_service.repository.ImageRepository;
import project.content_service.util.UrlRewriter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageService {

    private final ImageRepository repository;
    private final ImageStorageService imageStorageService;
    private final UrlRewriter urlRewriter;
    private final ImageFileValidator imageFileValidator;
    private final UserClientService userClientService;

    @Transactional
    public UploadImageResponse upload(MultipartFile file, UUID userId, UploadImageRequest request) {

        if (file.isEmpty()) {
            throw new FileUploadException("Файл пустой");
        }

        log.info("Запущена загрузка изображения: userId={}, originalName={}", userId, file.getOriginalFilename());

        byte[] bytes;

        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new FileUploadException("Ошибка чтения файла");
        }

        ImageFileValidator.ValidatedImage validatedImage = imageFileValidator.validate(
                bytes,
                file.getContentType(),
                file.getOriginalFilename()
        );

        ImageResponse image = imageStorageService.save(
                bytes,
                validatedImage.contentType(),
                validatedImage.extension(),
                userId,
                request.getDescription(),
                request.getTags(),
                ImageSource.UPLOAD
        );

        log.info("Изображение успешно загружено: userId={}, url={}", userId, image.getUrl());

        return UploadImageResponse.builder()
                .url(urlRewriter.rewriteForExternalAccess(image.getUrl()))
                .build();
    }

    public List<ImageResponse> getAll() {
        return repository.findAll()
                .stream()
                .map(imageStorageService::mapToResponse)
                .toList();
    }

    public List<UserImageResponse> getByUser(UUID userId) {
        return repository.findByUserId(userId)
                .stream()
                .map(this::mapToUserImageResponse)
                .toList();
    }

    public List<UserImageResponse> getUploadedByUser(UUID userId) {
        return repository.findByUserIdAndSource(userId, ImageSource.UPLOAD)
                .stream()
                .map(this::mapToUserImageResponse)
                .toList();
    }

    public List<UserImageResponse> getUploadedByUserNickname(String nickname, String authorizationHeader) {
        UUID userId = userClientService.getUserIdByNickname(nickname, authorizationHeader);
        return getUploadedByUser(userId);
    }

    public List<UserImageResponse> getGeneratedByUser(UUID userId) {
        return repository.findByUserIdAndSource(userId, ImageSource.GENERATED)
                .stream()
                .map(this::mapToUserImageResponse)
                .toList();
    }

    public List<UserImageResponse> getGeneratedByUserNickname(String nickname, String authorizationHeader) {
        UUID userId = userClientService.getUserIdByNickname(nickname, authorizationHeader);
        return getGeneratedByUser(userId);
    }

    public List<ImageResponse> searchByTags(List<String> tags) {

        if (tags == null || tags.isEmpty()) {
            log.info("Поиск изображений по тегам завершён без результата: передан пустой список тегов");
            return List.of();
        }

        List<String> normalized = tags.stream()
                .map(t -> t.toLowerCase().trim())
                .filter(t -> !t.isBlank())
                .distinct()
                .toList();

        if (normalized.isEmpty()) {
            return List.of();
        }

        return repository.findByTags(normalized, normalized.size())
                .stream()
                .map(imageStorageService::mapToResponse)
                .toList();
    }

    private UserImageResponse mapToUserImageResponse(Image image) {
        return UserImageResponse.builder()
                .url(urlRewriter.rewriteForExternalAccess(image.getUrl()))
                .build();
    }

}
