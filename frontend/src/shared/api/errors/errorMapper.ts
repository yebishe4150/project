import type {errorTypes} from "./errorTypes"
import {typeGuard} from "../errors/typeGuard"

export function mapError(e: unknown): ApiError {
  if (e.status === 401) {
    return { message: "Неверный логин или пароль" };
  }

  if (e.status === 409) {
    return {
      field: "login",
      message: "Этот логин уже занят"
    };
  }

  if (e.status === 400) {
    return {
      field: "password",
      message: "Пароль должен:\n- содержать минимум 8 символов\n- включать заглавную букву\n- содержать цифру"
    };
  }

  if (e.status >= 500) {
      return {
        message: "Что-то пошло не так. Попробуйте позже"
      };
    }

  return {
    message: "Неизвестная ошибка"
  };
}