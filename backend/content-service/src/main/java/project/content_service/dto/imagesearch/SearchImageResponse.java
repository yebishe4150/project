package project.content_service.dto.imagesearch;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@Schema(description = "Изображение из результатов поиска")
public class SearchImageResponse {

    private UUID id;

    private String url;

    private UUID userId;

    private String description;

    private LocalDateTime createTime;

    private long likesCount;

    private boolean liked;
}
