import { apiFetch } from "@/shared/api/apiClient"

type ApiResponse<T> = {
  data: T
  message: string
}

type ProfileImageApiResponse = {
  id: string
  url: string
  description?: string | null
  createTime: string
  likesCount: number
  liked: boolean
}

export type ProfileImage = {
  id: string
  url: string
  description: string | null
  createTime: string
  likesCount: number
  liked: boolean
}

export type ProfileImageTab = "photos" | "ai"

function mapProfileImage(image: ProfileImageApiResponse): ProfileImage {
  return {
    id: image.id,
    url: image.url,
    description: image.description ?? null,
    createTime: image.createTime,
    likesCount: image.likesCount,
    liked: image.liked,
  }
}

export async function fetchPrivateProfileImages(tab: ProfileImageTab): Promise<ProfileImage[]> {
  const endpoint =
    tab === "photos"
      ? "/content/images/user/uploads"
      : "/content/images/user/generated"

  const response = await apiFetch<ApiResponse<ProfileImageApiResponse[]>>(endpoint)

  return response.data.map(mapProfileImage)
}

export async function fetchPublicProfileImages(
  nickName: string,
  tab: ProfileImageTab,
): Promise<ProfileImage[]> {
  const endpoint =
    tab === "photos"
      ? `/content/images/users/${encodeURIComponent(nickName)}/uploads`
      : `/content/images/users/${encodeURIComponent(nickName)}/generated`

  const response = await apiFetch<ApiResponse<ProfileImageApiResponse[]>>(endpoint)

  return response.data.map(mapProfileImage)
}
