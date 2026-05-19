package project.content_service.repository;

import java.util.UUID;

public interface ImageLikeCount {

    UUID getImageId();

    long getLikesCount();
}
