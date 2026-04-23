import { apiFetch } from "@/shared/api/apiClient"

type GenerateImagePayload = {
  prompt: string
  description?: string
  tags?: string[]
}

type GenerateImageResponse = {
  imageUrl: string
}

export async function generateImage(payload: GenerateImagePayload) {
  return apiFetch<GenerateImageResponse>("/content/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}
