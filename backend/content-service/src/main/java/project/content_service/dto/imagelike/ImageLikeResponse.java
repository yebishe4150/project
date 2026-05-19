package project.content_service.dto.imagelike;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ImageLikeResponse {

    private UUID imageId;

    private boolean liked;

    private long likesCount;
}
