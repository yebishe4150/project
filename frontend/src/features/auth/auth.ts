import type {
  ApiResponse,
  ChangePasswordResponseData,
  LoginResponseData,
  RegisterResponseData,
  RefreshResponseData
} from "./model/api.types(raw)";

import {
  mapChangePasswordResponse,
  mapRegisterResponse,
  mapLoginResponse,
  mapRefreshResponse
} from "./auth.mapper";

import type { AuthData, RegisterResult } from "./model/frontTypes";
import { apiFetch } from "@/shared/api/apiClient.ts";
import { logApiError } from "@/shared/api/errors/errorMapper";
import type { ChangePasswordRequest, LoginRequest, RegisterRequest } from "./model/request.types";

// ================================
// 🔐 AUTH STATE
// ================================

// токен в memory
let accessToken: string | null = null;

// флаг авторизации (persist)
const AUTH_FLAG = "hasAuth";

// ================================
// 🔧 helpers
// ================================

export function setAccessToken(token: string) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

function setAuthFlag() {
  localStorage.setItem(AUTH_FLAG, "1");
}

function clearAuthFlag() {
  localStorage.removeItem(AUTH_FLAG);
}

function hasAuthFlag(): boolean {
  return !!localStorage.getItem(AUTH_FLAG);
}

export function canRefreshAuth(): boolean {
  return hasAuthFlag();
}

// ================================
// 🔄 REFRESH
// ================================

let refreshPromise: Promise<boolean> | null = null;

async function refreshRequest(): Promise<boolean> {
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
      clearAuthFlag();
      return false;
    }

    accessToken = data.accessToken;

    return true;
  } catch (error) {
    logApiError("Refresh token request failed", error, "warn");
    accessToken = null;
    clearAuthFlag();
    return false;
  }
}

export async function refresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshRequest().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

// ================================
// 🔍 CHECK AUTH
// ================================

export async function checkAuth(): Promise<boolean> {
  // ❗ ключевой фикс
  if (!hasAuthFlag()) {
    return false;
  }

  return refresh();
}

// ================================
// 📝 REGISTER
// ================================

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

// ================================
// 🔐 LOGIN
// ================================

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

  // ❗ ставим флаг
  setAuthFlag();

  return mapped;
}

// ================================
// CHANGE PASSWORD
// ================================

export async function changePassword(
  payload: ChangePasswordRequest
): Promise<void> {
  const raw = await apiFetch<ApiResponse<ChangePasswordResponseData>>(
    "/auth/change-password",
    {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" }
    }
  );

  const mapped = mapChangePasswordResponse(raw);

  accessToken = mapped.accessToken;
  setAuthFlag();
}

// ================================
// 🚪 LOGOUT
// ================================

export async function logout(): Promise<void> {
  try {
    await apiFetch(
      "/auth/logout",
      { method: "POST" }
    );
  } catch (e) {
    logApiError("Logout error", e, "warn");
  }

  accessToken = null;

  // ❗ чистим флаг
  clearAuthFlag();
}
