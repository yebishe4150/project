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
import { apiFetch } from "@/shared/api/apiClient.ts";
import type { LoginRequest, RegisterRequest } from "./model/request.types";

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
      return false;
    }

    accessToken = data.accessToken;

    return true;
  } catch {
    accessToken = null;
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
// 🚪 LOGOUT
// ================================

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

  // ❗ чистим флаг
  clearAuthFlag();
}
