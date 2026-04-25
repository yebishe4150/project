export const isDevProfileMockEnabled =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_PROFILE_MOCK === "true"

export type DevProfileUser = {
  id: string
  loginName: string
  nickname?: string | null
  firstName?: string | null
  secondName?: string | null
}

let devProfileUser: DevProfileUser = {
  id: "dev-user-1",
  loginName: "pinpet.dev",
  nickname: "Luna",
  firstName: "UI",
  secondName: "Preview",
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
