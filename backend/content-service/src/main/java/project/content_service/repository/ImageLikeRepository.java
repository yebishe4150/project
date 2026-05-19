package project.content_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import project.content_service.entity.ImageLike;
import project.content_service.entity.ImageLikeId;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ImageLikeRepository extends JpaRepository<ImageLike, ImageLikeId> {

    long countByImageId(UUID imageId);

    boolean existsByImageIdAndUserId(UUID imageId, UUID userId);

    void deleteByImageIdAndUserId(UUID imageId, UUID userId);

    @Query("""
            SELECT l.imageId AS imageId, COUNT(l) AS likesCount
            FROM ImageLike l
            WHERE l.imageId IN :imageIds
            GROUP BY l.imageId
            """)
    List<ImageLikeCount> countByImageIds(Collection<UUID> imageIds);

    @Query("""
            SELECT l.imageId
            FROM ImageLike l
            WHERE l.userId = :userId
              AND l.imageId IN :imageIds
            """)
    List<UUID> findLikedImageIds(UUID userId, Collection<UUID> imageIds);
}
