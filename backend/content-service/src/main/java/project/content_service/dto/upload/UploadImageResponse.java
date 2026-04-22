package project.content_service.dto.upload;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Schema(description = "Ответ на загрузку изображения")
public class UploadImageResponse {

    @Schema(description = "URL загруженного изображения")
    private String url;
}
