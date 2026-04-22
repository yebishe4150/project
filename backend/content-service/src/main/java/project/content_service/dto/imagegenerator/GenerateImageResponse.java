package project.content_service.dto.imagegenerator;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Schema(description = "Ответ на генерацию изображения")
public class GenerateImageResponse {

    @Schema(description = "URL сгенерированного изображения")
    private String url;
}
