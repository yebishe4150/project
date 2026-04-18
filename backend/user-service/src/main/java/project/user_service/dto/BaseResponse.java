package project.user_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Стандартный ответ API")
public class BaseResponse<T> {

    @Schema(description = "Данные ответа")
    private T data;

    @Schema(example = "Пользователь найден", description = "Сообщение")
    private String message;
}
