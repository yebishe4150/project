import type { ApiError } from "./errorTypes";
import { isApiError } from "./typeGuard";

export function mapAuthError(error: unknown): ApiError {
  if (!isApiError(error)) {
    return {
      status: 0,
      message: "Не удалось выполнить запрос. Попробуйте еще раз."
    };
  }

  if (error.status === 400) {
    return {
      status: error.status,
      field: "password",
      message: error.message || "Пароль должен содержать минимум 8 символов, включать хотя бы одну заглавную букву и одну цифру."
    };
  }

  if (error.status === 409) {
    return {
      status: error.status,
      field: "loginName",
      message: "Пользователь с таким логином уже существует."
    };
  }

  if (error.status === 502) {
    return {
      status: error.status,
      message: "Сервис регистрации временно недоступен. Попробуйте позже."
    };
  }

  if (error.status >= 500) {
    return {
      status: error.status,
      message: "Внутренняя ошибка сервера. Попробуйте позже."
    };
  }

  return {
    status: error.status,
    message: error.message || "Неизвестная ошибка."
  };
}
