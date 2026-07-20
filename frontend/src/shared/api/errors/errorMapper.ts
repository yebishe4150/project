import type { ApiError, ApiErrorField } from "./errorTypes";
import { isApiError } from "./typeGuard";
import i18n from "@/shared/config/i18n";

const te = (key: string, options?: Record<string, unknown>) => i18n.t(key, { ns: "errors", ...options });

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
    return te("common.tooManyRequestsWithDelay", { seconds: error.retryAfter });
  }

  return te("common.tooManyRequests");
}

export function normalizeApiError(error: unknown, fallbackMessage = te("common.requestFailed")): ApiError {
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

export function getApiErrorMessage(error: unknown, fallbackMessage = te("common.requestFailed")) {
  const apiError = normalizeApiError(error, fallbackMessage);
  const retryMessage = retryAfterMessage(apiError);

  if (retryMessage) {
    return retryMessage;
  }

  if (apiError.status === 0) {
    return te("common.network");
  }

  if (apiError.status === 401) {
    return te("common.sessionExpired");
  }

  if (apiError.status === 403) {
    return te("common.forbidden");
  }

  if (apiError.status === 502) {
    return te("common.serviceUnavailable");
  }

  if (apiError.status >= 500) {
    return te("common.server");
  }

  if (apiError.message) {
    return apiError.message;
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
      message: te("common.network"),
    };
  }

  if (error.status === 401) {
    return {
      ...error,
      message: te("common.sessionExpired"),
    };
  }

  if (error.status === 403) {
    return {
      ...error,
      message: te("common.forbidden"),
    };
  }

  if (error.status >= 500) {
    return {
      ...error,
      message: error.status === 502
        ? te("common.serviceUnavailable")
        : te("common.server"),
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
  const normalized = normalizeApiError(error, te("auth.requestFailed"));

  if (normalized.status === 400) {
    return {
      ...normalized,
      field: normalized.field ?? "password",
      message: normalized.message ||
        te("validation.passwordRequirements"),
    };
  }

  if (normalized.status === 401 && action === "login") {
    return {
      ...normalized,
      message: normalized.message || te("auth.invalidCredentials"),
    };
  }

  if (normalized.status === 409 && action === "signup") {
    return {
      ...normalized,
      field: normalized.field ?? "loginName",
      message: normalized.message || te("auth.loginExists"),
    };
  }

  return withCommonStatusMessages(normalized, te("common.unknown"));
}

export function mapChangePasswordError(error: unknown): ApiError {
  const normalized = normalizeApiError(error, te("profile.passwordChangeFailed"));

  if (normalized.status === 400) {
    return {
      ...normalized,
      field: normalized.field ?? "newPassword",
      message: normalized.message ||
        te("validation.passwordRequirements"),
    };
  }

  if (normalized.status === 401) {
    return {
      ...normalized,
      field: "currentPassword",
      message: normalized.message || te("profile.currentPasswordIncorrect"),
    };
  }

  return withCommonStatusMessages(normalized, te("profile.passwordChangeFailed"));
}

export function mapProfileError(error: unknown): ApiError {
  const normalized = normalizeApiError(error, te("profile.updateFailed"));

  if (normalized.status === 400) {
    return {
      ...normalized,
      message: normalized.message || te("profile.invalidData"),
    };
  }

  if (normalized.status === 409) {
    return {
      ...normalized,
      field: normalized.field ?? "nickname",
      message: normalized.message || te("profile.nicknameTaken"),
    };
  }

  if (normalized.status === 404) {
    return {
      ...normalized,
      message: normalized.message || te("profile.notFound"),
    };
  }

  return withCommonStatusMessages(normalized, te("profile.updateFailed"));
}

export function mapUploadImageError(error: unknown): ApiError {
  const normalized = normalizeApiError(error, te("media.uploadFailed"));

  if (normalized.status === 400) {
    return {
      ...normalized,
      field: normalized.field ?? "file",
      message: normalized.message || te("media.invalidFile"),
    };
  }

  if (normalized.status === 413) {
    return {
      ...normalized,
      field: "file",
      message: normalized.message || te("media.fileTooLarge"),
    };
  }

  return withCommonStatusMessages(normalized, te("media.uploadFailed"));
}

export function mapGenerateImageError(error: unknown): ApiError {
  const normalized = normalizeApiError(error, te("media.generationFailed"));

  if (normalized.status === 400) {
    return {
      ...normalized,
      field: normalized.field ?? "prompt",
      message: normalized.message || te("media.invalidPrompt"),
    };
  }

  return withCommonStatusMessages(normalized, te("media.generationFailed"));
}
