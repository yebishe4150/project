package project.content_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import project.content_service.entity.LandingFeed;

import java.util.List;
import java.util.UUID;

public interface LandingFeedRepository extends JpaRepository<LandingFeed, UUID> {

    @Query("select lf.imageId from LandingFeed lf")
    List<UUID> findAllImageIds();
}
