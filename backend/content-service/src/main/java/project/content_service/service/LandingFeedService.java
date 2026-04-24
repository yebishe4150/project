package project.content_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import project.content_service.dto.landingimage.LandingImageResponse;
import project.content_service.entity.Image;
import project.content_service.repository.ImageRepository;
import project.content_service.repository.LandingFeedRepository;
import project.content_service.util.UrlRewriter;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LandingFeedService {

    private static final int FEED_SIZE = 50;

    private final LandingFeedRepository landingRepository;
    private final ImageRepository imageRepository;
    private final UrlRewriter urlRewriter;

    public List<LandingImageResponse> getFeed() {

        List<UUID> ids = landingRepository.findAllImageIds();

        if (ids.isEmpty()) {
            return List.of();
        }

        Collections.shuffle(ids);

        int limit = Math.min(FEED_SIZE, ids.size());

        List<UUID> selected = ids.subList(0, limit);

        List<Image> images = imageRepository.findAllByIdIn(selected);

        Map<UUID, Image> map = images.stream()
                .collect(Collectors.toMap(Image::getId, i -> i));

        return selected.stream()
                .map(map::get)
                .filter(Objects::nonNull)
                .map(img -> LandingImageResponse.builder()
                        .url(urlRewriter.rewriteForExternalAccess(img.getUrl()))
                        .build())
                .toList();
    }
}
