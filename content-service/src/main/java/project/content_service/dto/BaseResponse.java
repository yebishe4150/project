package project.content_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Стандартный ответ API")
public class BaseResponse<T> {

    @Schema(description = "Данные ответа")
    private T data;

    @Schema(description = "Сообщение", example = "Пользователь создан")
    private String message;
}