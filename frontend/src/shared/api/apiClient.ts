import { refresh, getAccessToken, canRefreshAuth } from "@/features/auth/auth.ts";
import type { ApiError } from "./errors/errorTypes";

const BASE_URL = "/api/v1";

function fallbackMessageByStatus(status: number) {
  if (status === 0) {
    return "Network error. Please check your connection and try again.";
  }

  if (status === 401) {
    return "Unauthorized";
  }

  if (status === 403) {
    return "Forbidden";
  }

  if (status === 404) {
    return "Not found";
  }

  if (status === 413) {
    return "File is too large";
  }

  if (status === 429) {
    return "Too many requests";
  }

  if (status === 502) {
    return "Service is temporarily unavailable";
  }

  if (status >= 500) {
    return "Internal server error";
  }

  return "Request failed";
}

function parseRetryAfter(value: string | null) {
  if (!value) {
    return undefined;
  }

  const seconds = Number(value);

  return Number.isFinite(seconds) ? seconds : undefined;
}

async function readResponseBody(res: Response) {
  const text = await res.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (cause) {
    throw {
      status: res.ok ? 0 : res.status,
      message: res.ok ? "Unexpected server response" : fallbackMessageByStatus(res.status),
      retryAfter: parseRetryAfter(res.headers.get("Retry-After")),
      cause,
    } satisfies ApiError;
  }
}

function buildApiError(res: Response, data: unknown): ApiError {
  const body = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const message = typeof body.message === "string" && body.message.trim()
    ? body.message
    : fallbackMessageByStatus(res.status);
  const path = typeof body.path === "string" ? body.path : undefined;
  const timestamp = typeof body.timestamp === "string" ? body.timestamp : undefined;

  return {
    status: res.status,
    message,
    path,
    timestamp,
    retryAfter: parseRetryAfter(res.headers.get("Retry-After")),
  };
}

async function fetchWithAuth(url: string, options: RequestInit, token: string | null) {
  try {
    return await fetch(BASE_URL + url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    });
  } catch (cause) {
    throw {
      status: 0,
      message: fallbackMessageByStatus(0),
      cause,
    } satisfies ApiError;
  }
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  let res = await fetchWithAuth(url, options, getAccessToken());

  if (res.status === 401 && !url.includes("/auth/refresh") && canRefreshAuth()) {
    const ok = await refresh();

    if (!ok) {
      throw {
        status: 401,
        message: "Unauthorized",
        retryAfter: parseRetryAfter(res.headers.get("Retry-After")),
      } satisfies ApiError;
    }

    res = await fetchWithAuth(url, options, getAccessToken());
  }

  const data = await readResponseBody(res);

  if (!res.ok) {
    throw buildApiError(res, data);
  }

  return data as T;
}
