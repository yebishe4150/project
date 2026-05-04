import { apiFetch } from "@/shared/api/apiClient"
import type { FeedResponse, Pin } from "../pinTypes"

const DEV_FALLBACK_IMAGE_IDS = [
  1025,
  1062,
  1074,
  1084,
  169,
  200,
  219,
  237,
  433,
  577,
]

function mapLandingImageToPin(url: string, index: number): Pin {
  return {
    id: `${index}-${url}`,
    imageUrl: url,
    width: 300,
    height: 300,
    liked: false,
    likesCount: 0,
  }
}

function getDevFallbackPins(): Pin[] {
  return DEV_FALLBACK_IMAGE_IDS.map((id, index) =>
    mapLandingImageToPin(`https://picsum.photos/id/${id}/640/820`, index),
  )
}

export async function fetchPins(): Promise<Pin[]> {
  try {
    const response = await apiFetch<FeedResponse>("/content/public/feed")

    return response.data.map((image, index) => mapLandingImageToPin(image.url, index))
  } catch (error) {
    if (import.meta.env.DEV) {
      return getDevFallbackPins()
    }

    throw error
  }
}
