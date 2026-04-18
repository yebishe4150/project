package project.content_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import project.content_service.entity.Tag;

import java.util.List;
import java.util.UUID;

public interface TagRepository extends JpaRepository<Tag, UUID> {

    List<Tag> findByNameIn(List<String> names);
}
