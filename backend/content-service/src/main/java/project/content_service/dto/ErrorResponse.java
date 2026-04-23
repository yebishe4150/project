package project.content_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@Schema(description = "Ошибка API")
public class ErrorResponse {

    @Schema(description = "Сообщение об ошибке", example = "Файл не найден")
    private String message;

    @Schema(description = "HTTP статус", example = "400")
    private int status;

    private String path;

    @Schema(description = "Время ошибки")
    private LocalDateTime timestamp;
}
