package project.auth_service.exception;

import org.springframework.http.HttpStatus;

public class WeakPasswordException extends BaseException {

    public WeakPasswordException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}