import type { ApiError } from "./errors/errorTypes"

export async function handleApiResponse<T>(res: Response): Promise<T> {
  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    throw {
      status: res.status,
      message: data?.message || "Request failed",
    } as ApiError
  }

  return data as T
}
