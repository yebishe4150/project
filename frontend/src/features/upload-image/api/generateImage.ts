import { apiFetch } from "@/shared/api/apiClient"

type ApiResponse<T> = {
  data: T
  message: string
}

type GenerateImagePayload = {
  prompt: string
  description?: string
  tags?: string[]
}

type GenerateImageResponse = {
  url?: string
  imageUrl?: string
}

export async function generateImage(payload: GenerateImagePayload) {
  const response = await apiFetch<ApiResponse<GenerateImageResponse>>("/content/image-generations/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  return {
    imageUrl: response.data.url ?? response.data.imageUrl ?? "",
  }
}
