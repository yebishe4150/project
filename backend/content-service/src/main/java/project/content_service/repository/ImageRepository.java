package project.content_service.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import project.content_service.entity.Image;

import java.util.List;
import java.util.UUID;

public interface ImageRepository extends JpaRepository<Image, UUID> {

    List<Image> findByUserId(UUID userId);

    List<Image> findAllByIdIn(List<UUID> ids);

    @Query("select i from Image i order by function('random')")
    List<Image> getRandom(Pageable pageable);

    @Query("""
    SELECT i FROM Image i
    JOIN i.tags t
    WHERE t.name IN :tags
    GROUP BY i
    HAVING COUNT(DISTINCT t.name) = :size
""")
    List<Image> findByTags(List<String> tags, long size);
}