import type { ApiError } from "./errorTypes";
import { isApiError } from "./typeGuard";

type AuthAction = "login" | "signup";

export function mapAuthError(
  error: unknown,
  action: AuthAction = "signup"
): ApiError {
  if (!isApiError(error)) {
    return {
      status: 0,
      message: "Не удалось выполнить запрос. Попробуйте еще раз.",
    };
  }

  if (error.status === 400) {
    return {
      status: error.status,
      field: "password",
      message:
        error.message ||
        "Password must be at least 8 characters long and include at least one uppercase letter and one digit.",
    };
  }

  if (error.status === 401 && action === "login") {
    return {
      status: error.status,
      message: error.message || "Неверный логин или пароль.",
    };
  }

  if (error.status === 409 && action === "signup") {
    return {
      status: error.status,
      field: "loginName",
      message: "Пользователь с таким логином уже существует.",
    };
  }

  if (error.status === 502) {
    return {
      status: error.status,
      message: "Сервис авторизации временно недоступен. Попробуйте позже.",
    };
  }

  if (error.status >= 500) {
    return {
      status: error.status,
      message: "Внутренняя ошибка сервера. Попробуйте позже.",
    };
  }

  return {
    status: error.status,
    message: error.message || "Неизвестная ошибка.",
  };
}

export function mapChangePasswordError(error: unknown): ApiError {
  if (!isApiError(error)) {
    return {
      status: 0,
      message: "Could not change the password. Please try again.",
    };
  }

  if (error.status === 400) {
    return {
      status: error.status,
      field: "newPassword",
      message:
        "Password must be at least 8 characters long and include at least one uppercase letter and one digit.",
    };
  }

  if (error.status === 401) {
    return {
      status: error.status,
      field: "currentPassword",
      message: "Current password is incorrect.",
    };
  }

  if (error.status === 403) {
    return {
      status: error.status,
      message: "You do not have permission to change the password.",
    };
  }

  if (error.status >= 500) {
    return {
      status: error.status,
      message: "Internal server error. Please try again later.",
    };
  }

  return {
    status: error.status,
    message: "Could not change the password. Please try again.",
  };
}
