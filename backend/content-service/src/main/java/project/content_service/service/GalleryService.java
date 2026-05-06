package project.content_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.content_service.dto.gallery.GalleryImageResponse;
import project.content_service.dto.gallery.GalleryTagResponse;
import project.content_service.entity.Tag;
import project.content_service.exception.NotFoundException;
import project.content_service.repository.ImageRepository;
import project.content_service.repository.TagRepository;
import project.content_service.util.UrlRewriter;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GalleryService {

    private final TagRepository tagRepository;
    private final ImageRepository imageRepository;
    private final UrlRewriter urlRewriter;

    @Transactional(readOnly = true)
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

    @Transactional(readOnly = true)
    public List<GalleryImageResponse> getImagesByTag(UUID tagId) {
        if (!tagRepository.existsById(tagId)) {
            throw new NotFoundException("Тег не найден");
        }

        return imageRepository.findByTagId(tagId)
                .stream()
                .map(image -> GalleryImageResponse.builder()
                        .url(urlRewriter.rewriteForExternalAccess(image.getUrl()))
                        .build())
                .toList();
    }
}
