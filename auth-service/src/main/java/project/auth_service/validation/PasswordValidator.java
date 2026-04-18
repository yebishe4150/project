package project.auth_service.validation;

import project.auth_service.exception.WeakPasswordException;

public class PasswordValidator {

    public static void validate(String password) {

        if (password == null || password.isBlank()) {
            throw new WeakPasswordException("Пароль не может быть пустым");
        }

        if (password.length() < 8) {
            throw new WeakPasswordException("Пароль должен содержать не менее 8 символов");
        }

        if (!password.matches(".*[A-Z].*")) {
            throw new WeakPasswordException("Пароль должен содержать хотя бы одну заглавную букву");
        }

        if (!password.matches(".*\\d.*")) {
            throw new WeakPasswordException("Пароль должен содержать хотя бы одну цифру");
        }
    }
}