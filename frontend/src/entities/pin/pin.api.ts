import { apiFetch } from "@/shared/api/apiClient"
import type { FeedResponse, Pin } from "../pinTypes"

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

export async function fetchPins(): Promise<Pin[]> {
  const response = await apiFetch<FeedResponse>("/content/public/feed")

  return response.data.map((image, index) => mapLandingImageToPin(image.url, index))
}
