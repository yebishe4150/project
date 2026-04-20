import type { RegisterRequest } from "./request.types";
import type { RegisterValidationErrors } from "./validation.types";

function hasUppercase(value: string) {
  return /[A-ZА-Я]/.test(value);
}

function hasDigit(value: string) {
  return /\d/.test(value);
}

export function validateRegisterForm(values: RegisterRequest): RegisterValidationErrors {
  const errors: RegisterValidationErrors = {};

  if (!values.loginName.trim()) {
    errors.loginName = "Поле логина обязательно.";
  }

  if (!values.password) {
    errors.password = "Поле пароля обязательно.";
    return errors;
  }

  if (values.password.length < 8) {
    errors.password = "Пароль должен быть не менее 8 символов.";
    return errors;
  }

  if (!hasUppercase(values.password)) {
    errors.password = "Пароль должен содержать хотя бы одну заглавную букву.";
    return errors;
  }

  if (!hasDigit(values.password)) {
    errors.password = "Пароль должен содержать хотя бы одну цифру.";
  }

  return errors;
}

export function isRegisterFormValid(values: RegisterRequest) {
  return Object.keys(validateRegisterForm(values)).length === 0;
}
