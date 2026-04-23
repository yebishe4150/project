package project.content_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import project.content_service.dto.image.ImageResponse;
import project.content_service.dto.upload.UploadImageRequest;
import project.content_service.dto.upload.UploadImageResponse;
import project.content_service.dto.userimage.UserImageResponse;
import project.content_service.exception.FileUploadException;
import project.content_service.repository.ImageRepository;
import project.content_service.util.UrlRewriter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ImageService {

    private final ImageRepository repository;
    private final ImageStorageService imageStorageService;
    private final UrlRewriter urlRewriter;

    @Transactional
    public UploadImageResponse upload(MultipartFile file, UUID userId, UploadImageRequest request) {

        if (file.isEmpty()) {
            throw new FileUploadException("Файл пустой");
        }

        byte[] bytes;

        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new FileUploadException("Ошибка чтения файла");
        }

        ImageResponse image = imageStorageService.save(
                bytes,
                file.getContentType(),
                file.getOriginalFilename(),
                userId,
                request.getDescription(),
                request.getTags()
        );

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
                .map(image -> UserImageResponse.builder()
                        .url(urlRewriter.rewriteForExternalAccess(image.getUrl()))
                        .build())
                .toList();
    }

    public List<ImageResponse> searchByTags(List<String> tags) {

        if (tags == null || tags.isEmpty()) {
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
}
