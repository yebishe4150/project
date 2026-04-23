package project.content_service.dto.upload;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Запрос на загрузку изображения")
public class UploadImageRequest {

    @Schema(description = "Описание изображения", example = "Красивая картинка")
    private String description;

    @Schema(description = "Тэги изображения", example = "animals")
    private List<String> tags;
}
