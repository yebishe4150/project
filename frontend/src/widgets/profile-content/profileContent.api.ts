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
}

export type ProfileImage = {
  id: string
  url: string
  description: string | null
  createTime: string
}

export type ProfileImageTab = "photos" | "ai"

function mapProfileImage(image: ProfileImageApiResponse): ProfileImage {
  return {
    id: image.id,
    url: image.url,
    description: image.description ?? null,
    createTime: image.createTime,
  }
}

export async function fetchProfileImages(tab: ProfileImageTab): Promise<ProfileImage[]> {
  const endpoint =
    tab === "photos"
      ? "/content/images/user/uploads"
      : "/content/images/user/generated"

  const response = await apiFetch<ApiResponse<ProfileImageApiResponse[]>>(endpoint)

  return response.data.map(mapProfileImage)
}
