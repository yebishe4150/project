import type { LoginRequest, RegisterRequest } from "./request.types";
import type { AuthValidationErrors } from "./validation.types";
import i18n from "@/shared/config/i18n";

function hasUppercase(value: string) {
  return /[A-ZА-Я]/.test(value);
}

function hasDigit(value: string) {
  return /\d/.test(value);
}

export function validatePasswordRules(password: string): string | undefined {
  if (!password) {
    return i18n.t("validation.passwordRequired", { ns: "errors" });
  }

  if (password.length < 8) {
    return i18n.t("validation.passwordMinLength", { ns: "errors" });
  }

  if (!hasUppercase(password)) {
    return i18n.t("validation.passwordUppercase", { ns: "errors" });
  }

  if (!hasDigit(password)) {
    return i18n.t("validation.passwordDigit", { ns: "errors" });
  }

  return undefined;
}

export function validateLoginForm(values: LoginRequest): AuthValidationErrors {
  const errors: AuthValidationErrors = {};

  if (!values.loginName.trim()) {
    errors.loginName = i18n.t("validation.loginRequired", { ns: "errors" });
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
