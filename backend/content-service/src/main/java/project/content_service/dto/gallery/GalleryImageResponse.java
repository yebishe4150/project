package project.content_service.dto.gallery;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Schema(description = "Изображение галереи")
public class GalleryImageResponse {

    @Schema(description = "URL изображения")
    private String url;
}
