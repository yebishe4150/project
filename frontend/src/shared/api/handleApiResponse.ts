import type {errorTypes} from "../api/errors/errorTypes"

export async function handleApiResponse<T>(res: Response): Promise<T> {
  const data = await res.json();

  if (!res.ok) {
    throw {
      status: res.status,
      message: data.message
    } as ApiError;
  }

  return data;
}