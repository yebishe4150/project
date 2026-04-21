import { refresh, getAccessToken, canRefreshAuth } from "@/features/auth/auth.ts";

const BASE_URL = "/api/v1";

// ================================
// 🌐 API FETCH
// ================================

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

  // 🔄 retry при 401
  if (res.status === 401 && !url.includes("/auth/refresh") && canRefreshAuth()) {

    // ❗ ВАЖНО: используем lock
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
        ...(newToken ? { Authorization: `Bearer ${newToken}` } : {})
      },
      credentials: "include"
    });
  }

  // 📦 безопасный парсинг
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  // ❌ централизованная ошибка
  if (!res.ok) {
    throw {
      status: res.status,
      message: data?.message || "Request failed"
    };
  }

  return data;
}
