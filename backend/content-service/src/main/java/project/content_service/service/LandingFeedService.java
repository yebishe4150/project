package project.content_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import project.content_service.dto.landingimage.LandingImageResponse;
import project.content_service.entity.Image;
import project.content_service.repository.ImageRepository;
import project.content_service.repository.LandingFeedRepository;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LandingFeedService {

    private final LandingFeedRepository landingRepository;
    private final ImageRepository imageRepository;

    private static final int FEED_SIZE = 5;

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
                        .url(img.getUrl())
                        .build())
                .toList();
    }
}