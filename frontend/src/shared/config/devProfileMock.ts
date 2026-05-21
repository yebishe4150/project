export const isDevProfileMockEnabled =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_PROFILE_MOCK === "true"

export const isDevProfile404MockEnabled =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_PROFILE_404_MOCK === "true"

export const isDevAuthMockEnabled = isDevProfileMockEnabled || isDevProfile404MockEnabled

export type DevProfileUser = {
  id: string
  loginName: string
  nickname?: string | null
  firstName?: string | null
  secondName?: string | null
  email?: string
  phoneNumber?: string
}

let devProfileUser: DevProfileUser = {
  id: "dev-user-1",
  loginName: "pinpet.dev",
  nickname: "Luna",
  firstName: "UI",
  secondName: "Preview",
  email: "luna@example.com",
  phoneNumber: "",
}

export function getDevProfileUser() {
  return devProfileUser
}

export function updateDevProfileNickname(nickname: string) {
  devProfileUser = {
    ...devProfileUser,
    nickname,
  }

  return devProfileUser
}

export function updateDevProfile(
  payload: Partial<Pick<DevProfileUser, "nickname" | "firstName" | "secondName" | "email" | "phoneNumber">>,
) {
  devProfileUser = {
    ...devProfileUser,
    ...payload,
  }

  return devProfileUser
}
