import { apiFetch } from "@/shared/api/apiClient"

type ApiResponse<T> = {
  data: T
  message: string
}

export type ProfileUserResponse = {
  id: string
  loginName: string
  nickname?: string | null
  firstName?: string | null
  secondName?: string | null
}

export async function fetchCurrentUser() {
  const response = await apiFetch<ApiResponse<ProfileUserResponse>>("/users/me")

  return response.data
}

export async function updateCurrentUserNickname(nickname: string) {
  const response = await apiFetch<ApiResponse<ProfileUserResponse>>("/users/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname }),
  })

  return response.data
}
