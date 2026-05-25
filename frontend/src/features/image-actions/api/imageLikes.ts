import { apiFetch } from "@/shared/api/apiClient"

type ApiResponse<T> = {
  data: T
  message: string
}

export type ImageLikeState = {
  liked: boolean
  likesCount: number
}

const DEV_LIKES_STORAGE_KEY = "pinpet-dev-image-likes"

function getDevLikes(): Record<string, ImageLikeState> {
  try {
    return JSON.parse(window.localStorage.getItem(DEV_LIKES_STORAGE_KEY) ?? "{}")
  } catch {
    return {}
  }
}

function setDevLike(imageId: string, liked: boolean): ImageLikeState {
  const likes = getDevLikes()
  const current = likes[imageId] ?? { liked: false, likesCount: 0 }
  const nextState = {
    liked,
    likesCount: Math.max(0, current.likesCount + (liked === current.liked ? 0 : liked ? 1 : -1)),
  }

  likes[imageId] = nextState
  window.localStorage.setItem(DEV_LIKES_STORAGE_KEY, JSON.stringify(likes))

  return nextState
}

export async function setImageLike(imageId: string, liked: boolean): Promise<ImageLikeState> {
  if (import.meta.env.DEV && imageId.startsWith("dev-")) {
    return setDevLike(imageId, liked)
  }

  const response = await apiFetch<ApiResponse<ImageLikeState>>(`/content/images/${imageId}/like`, {
    method: liked ? "PUT" : "DELETE",
  })

  return response.data
}
