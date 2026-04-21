package project.user_service.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ErrorResponse {

    private String message;
    private String code;
    private int status;
    private String path;
    private LocalDateTime timestamp;
}
