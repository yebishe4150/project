package project.content_service.dto.gallery;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
@Schema(description = "Изображение галереи")
public class GalleryImageResponse {

    @Schema(description = "ID изображения")
    private UUID id;

    @Schema(description = "URL изображения")
    private String url;

    private long likesCount;

    private boolean liked;
}
