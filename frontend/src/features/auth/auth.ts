import type {
  ApiResponse,
  LoginResponseData,
  RegisterResponseData,
  RefreshResponseData
} from "./model/api.types(raw)";

import {
  mapRegisterResponse,
  mapLoginResponse,
  mapRefreshResponse
} from "./auth.mapper";

import type { AuthData, RegisterResult } from "./model/frontTypes";
import { apiFetch } from "../../shared/api/apiClient";
import type { LoginRequest, RegisterRequest } from "./model/request.types";

//токен хранится в memory
let accessToken: string | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

//проверка авторизации
export async function refresh(): Promise<boolean> {
  try {
    const raw = await apiFetch<ApiResponse<RefreshResponseData>>(
      "/auth/refresh",
      {
        method: "POST"
      }
    );

    const data = mapRefreshResponse(raw);

    if (!data.accessToken) {
      accessToken = null;
      return false;
    }

    accessToken = data.accessToken;

    return true;
  } catch (e) {
    accessToken = null;
    return false;
  }
}

export async function checkAuth(): Promise<boolean> {
  return refresh();
}

//регистрация
export async function register(
  payload: RegisterRequest
): Promise<RegisterResult> {

  const raw = await apiFetch<ApiResponse<RegisterResponseData>>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" }
    }
  );

  return mapRegisterResponse(raw);
}

//логин
export async function login(
  payload: LoginRequest
): Promise<AuthData> {

  const raw = await apiFetch<ApiResponse<LoginResponseData>>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" }
    }
  );

  const mapped = mapLoginResponse(raw);

  accessToken = mapped.accessToken;

  return mapped;
}

//логаут
export async function logout(): Promise<void> {
  try {
    await apiFetch(
      "/auth/logout",
      { method: "POST" }
    );
  } catch (e) {
    console.warn("Logout error:", e);
  }

  accessToken = null;
}