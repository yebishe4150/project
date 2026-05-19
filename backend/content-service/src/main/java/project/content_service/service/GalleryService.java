package project.content_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import project.content_service.dto.gallery.GalleryImageResponse;
import project.content_service.dto.gallery.GalleryTagResponse;
import project.content_service.entity.Image;
import project.content_service.entity.Tag;
import project.content_service.exception.NotFoundException;
import project.content_service.repository.ImageRepository;
import project.content_service.repository.TagRepository;
import project.content_service.util.UrlRewriter;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GalleryService {

    private final TagRepository tagRepository;
    private final ImageRepository imageRepository;
    private final UrlRewriter urlRewriter;
    private final ImageLikeService imageLikeService;

    public List<GalleryTagResponse> getTags() {
        return tagRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Tag::getName))
                .map(tag -> GalleryTagResponse.builder()
                        .id(tag.getId())
                        .name(tag.getName())
                        .build())
                .toList();
    }

    public List<GalleryImageResponse> getImagesByTag(UUID tagId, UUID requesterId) {
        if (!tagRepository.existsById(tagId)) {
            throw new NotFoundException("Тег не найден");
        }

        List<Image> images = imageRepository.findByTagId(tagId);
        List<UUID> imageIds = images.stream()
                .map(Image::getId)
                .toList();
        Map<UUID, Long> likeCounts = imageLikeService.getLikeCounts(imageIds);
        Set<UUID> likedImageIds = imageLikeService.getLikedImageIds(requesterId, imageIds);

        return images.stream()
                .map(image -> GalleryImageResponse.builder()
                        .id(image.getId())
                        .url(urlRewriter.rewriteForExternalAccess(image.getUrl()))
                        .likesCount(likeCounts.getOrDefault(image.getId(), 0L))
                        .liked(likedImageIds.contains(image.getId()))
                        .build())
                .toList();
    }
}
