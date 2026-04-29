package project.user_service.validation;

import project.user_service.exception.ValidationException;

public class NicknameValidator {

    private static final int MIN_NICKNAME_LENGTH = 3;
    private static final int MAX_NICKNAME_LENGTH = 20;

    public static void validate(String nickname) {
        if (nickname == null || nickname.isEmpty()) {
            return;
        }

        if (nickname.length() < MIN_NICKNAME_LENGTH || nickname.length() > MAX_NICKNAME_LENGTH) {
            throw new ValidationException("nickname должен быть от 3 до 20 символов");
        }

        for (int i = 0; i < nickname.length(); i++) {
            char ch = nickname.charAt(i);
            boolean valid = ch >= 'a' && ch <= 'z'
                    || ch >= '0' && ch <= '9'
                    || ch == '_'
                    || ch == '-';

            if (!valid) {
                throw new ValidationException("nickname может содержать только английские буквы, цифры, дефис и подчёркивание");
            }
        }
    }
}
