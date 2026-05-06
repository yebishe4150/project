package project.content_service.dto.gallery;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Категория галереи")
public class GalleryTagResponse {

    @Schema(description = "ID тега")
    private UUID id;

    @Schema(description = "Название тега")
    private String name;

}
