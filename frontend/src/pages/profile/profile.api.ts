import { apiFetch } from "@/shared/api/apiClient"
import {
  getDevProfileUser,
  isDevProfile404MockEnabled,
  isDevProfileMockEnabled,
  updateDevProfile,
  updateDevProfileNickname,
} from "@/shared/config/devProfileMock"

type ApiResponse<T> = {
  data: T
  message: string
}

export type ProfileUserResponse = {
  id?: string
  loginName: string
  nickname?: string | null
  firstName?: string | null
  secondName?: string | null
  email?: string
  phoneNumber?: string
}

export type UpdateCurrentUserProfileRequest = {
  nickname?: string
  firstName?: string
  secondName?: string
  email?: string
  phoneNumber?: string
}

function throwDevProfile404() {
  throw {
    status: 404,
    message: "Dev profile 404 mock",
  }
}

export async function fetchCurrentUser() {
  if (isDevProfile404MockEnabled) {
    throwDevProfile404()
  }

  if (isDevProfileMockEnabled) {
    return getDevProfileUser()
  }

  const response = await apiFetch<ApiResponse<ProfileUserResponse>>("/users/me")

  return response.data
}

export async function updateCurrentUserNickname(nickname: string) {
  if (isDevProfile404MockEnabled) {
    throwDevProfile404()
  }

  if (isDevProfileMockEnabled) {
    return updateDevProfileNickname(nickname)
  }

  const response = await apiFetch<ApiResponse<ProfileUserResponse>>("/users/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname }),
  })

  return response.data
}

export async function updateCurrentUserProfile(payload: UpdateCurrentUserProfileRequest) {
  if (isDevProfile404MockEnabled) {
    throwDevProfile404()
  }

  if (isDevProfileMockEnabled) {
    return updateDevProfile(payload)
  }

  const response = await apiFetch<ApiResponse<ProfileUserResponse>>("/users/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function fetchPublicUser(nickname: string) {
  if (isDevProfileMockEnabled) {
    return getDevProfileUser()
  }

  const response = await apiFetch<ApiResponse<ProfileUserResponse>>(
    `/users/${encodeURIComponent(nickname)}`,
  )

  return response.data
}
