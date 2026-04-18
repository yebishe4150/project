package project.content_service.scheduler;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import project.content_service.entity.Image;
import project.content_service.entity.LandingFeed;
import project.content_service.repository.ImageRepository;
import project.content_service.repository.LandingFeedRepository;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class LandingFeedScheduler {

    private final ImageRepository imageRepository;
    private final LandingFeedRepository landingRepository;

    /**
     * Обновление лендинг-фида
     * Раз в неделю (понедельник в 03:00)
     */
    @Scheduled(cron = "0 0 3 * * MON")
    public void refreshLandingFeed() {

        log.info("Start refreshing landing feed");

        long total = imageRepository.count();
        if (total == 0) {
            log.warn("No images found, landing feed not updated");
            return;
        }

        int limit = (int) Math.min(100, total);

        List<Image> randomImages = imageRepository.getRandom(PageRequest.of(0, limit));

        landingRepository.deleteAll();

        List<LandingFeed> feed = randomImages.stream()
                .map(img -> {
                    LandingFeed lf = new LandingFeed();
                    lf.setImageId(img.getId());
                    return lf;
                })
                .toList();

        landingRepository.saveAll(feed);

        log.info("Landing feed updated: {} images", feed.size());
    }

    @PostConstruct
    public void init() {
        refreshLandingFeed();
    }
}