import type { ApiError, ApiErrorField } from "./errorTypes";
import { isApiError } from "./typeGuard";

type AuthAction = "login" | "signup";
type LogLevel = "warn" | "error";

const API_FIELDS = new Set<ApiErrorField>([
  "loginName",
  "password",
  "currentPassword",
  "newPassword",
  "email",
  "phoneNumber",
  "firstName",
  "secondName",
  "nickname",
  "prompt",
  "file",
  "tags",
]);

function parseFieldError(message: string): Pick<ApiError, "field" | "message"> {
  const match = message.match(/^([A-Za-z][A-Za-z0-9_]*):\s*(.+)$/);

  if (!match) {
    return { message };
  }

  const [, field, fieldMessage] = match;

  if (!API_FIELDS.has(field as ApiErrorField)) {
    return { message };
  }

  return {
    field: field as ApiErrorField,
    message: fieldMessage,
  };
}

function retryAfterMessage(error: ApiError) {
  if (error.status !== 429) {
    return null;
  }

  if (error.retryAfter) {
    return `Too many requests. Please try again in ${error.retryAfter} seconds.`;
  }

  return "Too many requests. Please try again later.";
}

export function normalizeApiError(error: unknown, fallbackMessage = "Request failed. Please try again."): ApiError {
  if (!isApiError(error)) {
    return {
      status: 0,
      message: fallbackMessage,
      cause: error,
    };
  }

  const parsed = parseFieldError(error.message);

  return {
    ...error,
    ...parsed,
  };
}

export function getApiErrorMessage(error: unknown, fallbackMessage = "Request failed. Please try again.") {
  const apiError = normalizeApiError(error, fallbackMessage);
  const retryMessage = retryAfterMessage(apiError);

  if (retryMessage) {
    return retryMessage;
  }

  if (apiError.message) {
    return apiError.message;
  }

  if (apiError.status >= 500) {
    return "Server error. Please try again later.";
  }

  return fallbackMessage;
}

export function logApiError(context: string, error: unknown, level: LogLevel = "error") {
  const apiError = normalizeApiError(error);

  console[level](`${context}:`, {
    status: apiError.status,
    message: apiError.message,
    field: apiError.field,
    path: apiError.path,
    timestamp: apiError.timestamp,
    retryAfter: apiError.retryAfter,
    cause: apiError.cause,
  });
}

function withCommonStatusMessages(error: ApiError, fallbackMessage: string): ApiError {
  const retryMessage = retryAfterMessage(error);

  if (retryMessage) {
    return {
      ...error,
      message: retryMessage,
    };
  }

  if (error.status === 0) {
    return {
      ...error,
      message: "Network error. Please check your connection and try again.",
    };
  }

  if (error.status === 401) {
    return {
      ...error,
      message: "Your session has expired. Please log in again.",
    };
  }

  if (error.status === 403) {
    return {
      ...error,
      message: "You do not have permission to perform this action.",
    };
  }

  if (error.status >= 500) {
    return {
      ...error,
      message: error.status === 502
        ? "Service is temporarily unavailable. Please try again later."
        : "Server error. Please try again later.",
    };
  }

  return {
    ...error,
    message: error.message || fallbackMessage,
  };
}

export function mapAuthError(
  error: unknown,
  action: AuthAction = "signup",
): ApiError {
  const normalized = normalizeApiError(error, "Could not complete the request. Please try again.");

  if (normalized.status === 400) {
    return {
      ...normalized,
      field: normalized.field ?? "password",
      message: normalized.message ||
        "Password must be at least 8 characters long and include at least one uppercase letter and one digit.",
    };
  }

  if (normalized.status === 401 && action === "login") {
    return {
      ...normalized,
      message: normalized.message || "Invalid login or password.",
    };
  }

  if (normalized.status === 409 && action === "signup") {
    return {
      ...normalized,
      field: normalized.field ?? "loginName",
      message: normalized.message || "A user with this login already exists.",
    };
  }

  return withCommonStatusMessages(normalized, "Unknown error.");
}

export function mapChangePasswordError(error: unknown): ApiError {
  const normalized = normalizeApiError(error, "Could not change the password. Please try again.");

  if (normalized.status === 400) {
    return {
      ...normalized,
      field: normalized.field ?? "newPassword",
      message: normalized.message ||
        "Password must be at least 8 characters long and include at least one uppercase letter and one digit.",
    };
  }

  if (normalized.status === 401) {
    return {
      ...normalized,
      field: "currentPassword",
      message: normalized.message || "Current password is incorrect.",
    };
  }

  return withCommonStatusMessages(normalized, "Could not change the password. Please try again.");
}

export function mapProfileError(error: unknown): ApiError {
  const normalized = normalizeApiError(error, "Could not update the profile. Please try again.");

  if (normalized.status === 400) {
    return {
      ...normalized,
      message: normalized.message || "Please check the profile data and try again.",
    };
  }

  if (normalized.status === 409) {
    return {
      ...normalized,
      field: normalized.field ?? "nickname",
      message: normalized.message || "This nickname is already taken.",
    };
  }

  if (normalized.status === 404) {
    return {
      ...normalized,
      message: normalized.message || "Profile was not found.",
    };
  }

  return withCommonStatusMessages(normalized, "Could not update the profile. Please try again.");
}

export function mapUploadImageError(error: unknown): ApiError {
  const normalized = normalizeApiError(error, "Could not upload the image. Please try again.");

  if (normalized.status === 400) {
    return {
      ...normalized,
      field: normalized.field ?? "file",
      message: normalized.message || "Please choose a valid image file.",
    };
  }

  if (normalized.status === 413) {
    return {
      ...normalized,
      field: "file",
      message: normalized.message || "File is too large.",
    };
  }

  return withCommonStatusMessages(normalized, "Could not upload the image. Please try again.");
}

export function mapGenerateImageError(error: unknown): ApiError {
  const normalized = normalizeApiError(error, "Could not generate the image. Please try again.");

  if (normalized.status === 400) {
    return {
      ...normalized,
      field: normalized.field ?? "prompt",
      message: normalized.message || "Please enter a valid prompt.",
    };
  }

  return withCommonStatusMessages(normalized, "Could not generate the image. Please try again.");
}
