package project.content_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import project.content_service.dto.image.ImageResponse;
import project.content_service.entity.Image;
import project.content_service.entity.Tag;
import project.content_service.exception.FileUploadException;
import project.content_service.repository.ImageRepository;
import project.content_service.repository.TagRepository;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImageService {

    private final ImageRepository repository;
    private final TagRepository tagRepository;
    private final S3Client s3Client;

    @Value("${s3.bucket}")
    private String bucket;

    @Value("${s3.endpoint}")
    private String endpoint;

    @Transactional
    public ImageResponse upload(MultipartFile file, UUID userId, String description, List<String> tagNames) {

        if (file.isEmpty()) {
            throw new FileUploadException("Файл пустой");
        }

        String key = UUID.randomUUID() + "_" + file.getOriginalFilename();

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType(file.getContentType())
                            .build(),
                    RequestBody.fromBytes(file.getBytes())
            );
        } catch (IOException e) {
            throw new FileUploadException("Ошибка загрузки файла");
        }

        String url = String.format("%s/%s/%s", endpoint, bucket, key);

        Image image = Image.builder()
                .url(url)
                .userId(userId)
                .description(description)
                .build();

        if (tagNames != null && !tagNames.isEmpty()) {
            image.setTags(resolveTags(tagNames));
        }

        Image saved = repository.save(image);

        return mapToResponse(saved);
    }

    public List<ImageResponse> getAll() {
        return repository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<ImageResponse> getByUser(UUID userId) {
        return repository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
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
                .map(this::mapToResponse)
                .toList();
    }

    private ImageResponse mapToResponse(Image image) {
        return ImageResponse.builder()
                .id(image.getId())
                .url(image.getUrl())
                .userId(image.getUserId())
                .description(image.getDescription())
                .createTime(image.getCreateTime())
                .build();
    }

    private Set<Tag> resolveTags(List<String> tagNames) {

        List<String> normalized = tagNames.stream()
                .map(t -> t.toLowerCase().trim())
                .filter(t -> !t.isBlank())
                .distinct()
                .toList();

        List<Tag> existingTags = tagRepository.findByNameIn(normalized);

        Set<String> existingNames = existingTags.stream()
                .map(Tag::getName)
                .collect(Collectors.toSet());

        List<Tag> newTags = normalized.stream()
                .filter(name -> !existingNames.contains(name))
                .map(name -> Tag.builder().name(name).build())
                .toList();

        existingTags.addAll(tagRepository.saveAll(newTags));

        return new HashSet<>(existingTags);
    }
}