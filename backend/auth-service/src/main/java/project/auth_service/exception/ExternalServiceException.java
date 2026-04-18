package project.auth_service.exception;

import org.springframework.http.HttpStatus;

public class ExternalServiceException extends BaseException {

    public ExternalServiceException(String message) {
        super(message, HttpStatus.BAD_GATEWAY);
    }

    public ExternalServiceException(String message, Throwable cause) {
        super(message, cause, HttpStatus.BAD_GATEWAY);
    }
}