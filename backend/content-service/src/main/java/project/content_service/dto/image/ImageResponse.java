package project.content_service.dto.image;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@Schema(description = "Ответ с данными изображения")
public class ImageResponse {

    @Schema(description = "ID изображения")
    private UUID id;

    @Schema(description = "URL изображения")
    private String url;

    @Schema(description = "ID пользователя")
    private UUID userId;

    @Schema(description = "Описание")
    private String description;

    @Schema(description = "Время создания")
    private LocalDateTime createTime;
}