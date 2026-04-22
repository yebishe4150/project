package project.content_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import project.content_service.dto.image.ImageResponse;
import project.content_service.entity.Image;
import project.content_service.entity.Tag;
import project.content_service.exception.FileUploadException;
import project.content_service.repository.ImageRepository;
import project.content_service.repository.TagRepository;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImageStorageService {

    private final ImageRepository repository;
    private final TagRepository tagRepository;
    private final S3Client s3Client;

    @Value("${s3.bucket}")
    private String bucket;

    @Value("${s3.endpoint}")
    private String endpoint;

    public ImageResponse save(
            byte[] bytes,
            String contentType,
            String originalName,
            UUID userId,
            String description,
            List<String> tagNames
    ) {

        String key = UUID.randomUUID() + "_" + originalName;

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType(contentType)
                            .build(),
                    RequestBody.fromBytes(bytes)
            );
        } catch (Exception e) {
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

    public ImageResponse mapToResponse(Image image) {
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
