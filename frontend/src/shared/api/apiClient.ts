import { refresh, getAccessToken } from "../../features/auth/auth";

const BASE_URL = "/api/v1";


export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();

  let res = await fetch(BASE_URL + url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    credentials: "include"
  });

  // retry при 401
  if (res.status === 401 && !url.includes("/auth/refresh")) {
    const ok = await refresh();

    if (!ok) {
      throw {
        status: 401,
        message: "Unauthorized"
      };
    }

    const newToken = getAccessToken();

    res = await fetch(BASE_URL + url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${newToken}`
      },
      credentials: "include"
    });
  }

  //  парсим ответ
  const data = await res.json();

  // ❌ централизованная ошибка
  if (!res.ok) {
    throw {
      status: res.status,
      message: data?.message || "Request failed"
    };
  }

  return data;
}
