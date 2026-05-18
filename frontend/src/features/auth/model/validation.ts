import type { LoginRequest, RegisterRequest } from "./request.types";
import type { AuthValidationErrors } from "./validation.types";

function hasUppercase(value: string) {
  return /[A-ZА-Я]/.test(value);
}

function hasDigit(value: string) {
  return /\d/.test(value);
}

export function validatePasswordRules(password: string): string | undefined {
  if (!password) {
    return "Password is required.";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }

  if (!hasUppercase(password)) {
    return "Password must contain at least one uppercase letter.";
  }

  if (!hasDigit(password)) {
    return "Password must contain at least one digit.";
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
