import type { ApiError } from "./errors/errorTypes";

function parseRetryAfter(value: string | null) {
  if (!value) {
    return undefined;
  }

  const seconds = Number(value);

  return Number.isFinite(seconds) ? seconds : undefined;
}

export async function handleApiResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (cause) {
      throw {
        status: res.ok ? 0 : res.status,
        message: res.ok ? "Unexpected server response" : "Request failed",
        retryAfter: parseRetryAfter(res.headers.get("Retry-After")),
        cause,
      } satisfies ApiError;
    }
  }

  if (!res.ok) {
    const body = data && typeof data === "object" ? data as Record<string, unknown> : {};

    throw {
      status: res.status,
      message: typeof body.message === "string" && body.message.trim()
        ? body.message
        : "Request failed",
      path: typeof body.path === "string" ? body.path : undefined,
      timestamp: typeof body.timestamp === "string" ? body.timestamp : undefined,
      retryAfter: parseRetryAfter(res.headers.get("Retry-After")),
    } satisfies ApiError;
  }

  return data as T;
}
