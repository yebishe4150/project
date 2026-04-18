package project.content_service.dto.image;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Schema(description = "Запрос на загрузку изображения")
public class UploadImageRequest {

    @NotNull(message = "userId обязателен")
    @Schema(description = "Идентификатор пользователя", requiredMode = Schema.RequiredMode.REQUIRED)
    private UUID userId;

    @Schema(description = "Описание изображения", example = "Красивая картинка")
    private String description;

    @Schema(description = "Тэги изображения", example = "animals")
    private List<String> tags;
}