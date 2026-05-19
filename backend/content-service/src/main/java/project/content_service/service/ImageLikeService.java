package project.content_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.content_service.dto.imagelike.ImageLikeResponse;
import project.content_service.entity.ImageLike;
import project.content_service.entity.ImageLikeId;
import project.content_service.exception.NotFoundException;
import project.content_service.repository.ImageLikeRepository;
import project.content_service.repository.ImageRepository;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImageLikeService {

    private final ImageRepository imageRepository;
    private final ImageLikeRepository imageLikeRepository;

    @Transactional
    public ImageLikeResponse like(UUID imageId, UUID userId) {
        ensureImageExists(imageId);

        imageLikeRepository.findById(new ImageLikeId(imageId, userId))
                .orElseGet(() -> imageLikeRepository.save(ImageLike.builder()
                        .imageId(imageId)
                        .userId(userId)
                        .build()));

        return buildResponse(imageId, true);
    }

    @Transactional
    public ImageLikeResponse unlike(UUID imageId, UUID userId) {
        ensureImageExists(imageId);

        imageLikeRepository.deleteByImageIdAndUserId(imageId, userId);
        return buildResponse(imageId, false);
    }

    public Map<UUID, Long> getLikeCounts(Collection<UUID> imageIds) {
        if (imageIds == null || imageIds.isEmpty()) {
            return Collections.emptyMap();
        }

        return imageLikeRepository.countByImageIds(imageIds)
                .stream()
                .collect(Collectors.toMap(
                        count -> count.getImageId(),
                        count -> count.getLikesCount()
                ));
    }

    public Set<UUID> getLikedImageIds(UUID userId, Collection<UUID> imageIds) {
        if (userId == null || imageIds == null || imageIds.isEmpty()) {
            return Collections.emptySet();
        }

        return Set.copyOf(imageLikeRepository.findLikedImageIds(userId, imageIds));
    }

    private ImageLikeResponse buildResponse(UUID imageId, boolean liked) {
        return ImageLikeResponse.builder()
                .imageId(imageId)
                .liked(liked)
                .likesCount(imageLikeRepository.countByImageId(imageId))
                .build();
    }

    private void ensureImageExists(UUID imageId) {
        if (!imageRepository.existsById(imageId)) {
            throw new NotFoundException("Изображение не найдено");
        }
    }
}
