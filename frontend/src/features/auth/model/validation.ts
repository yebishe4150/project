import type { LoginRequest, RegisterRequest } from "./request.types";
import type { AuthValidationErrors } from "./validation.types";

function hasUppercase(value: string) {
  return /[A-ZА-Я]/.test(value);
}

function hasDigit(value: string) {
  return /\d/.test(value);
}

function validatePasswordRules(password: string): string | undefined {
  if (!password) {
    return "Поле пароля обязательно.";
  }

  if (password.length < 8) {
    return "Пароль должен быть не менее 8 символов.";
  }

  if (!hasUppercase(password)) {
    return "Пароль должен содержать хотя бы одну заглавную букву.";
  }

  if (!hasDigit(password)) {
    return "Пароль должен содержать хотя бы одну цифру.";
  }

  return undefined;
}

export function validateLoginForm(values: LoginRequest): AuthValidationErrors {
  const errors: AuthValidationErrors = {};

  if (!values.loginName.trim()) {
    errors.loginName = "Поле логина обязательно.";
  }

  const passwordError = validatePasswordRules(values.password);

  if (passwordError) {
    errors.password = passwordError;
  }

  return errors;
}

export function validateRegisterForm(values: RegisterRequest): AuthValidationErrors {
  return validateLoginForm(values);
}
