import { apiFetch } from "@/shared/api/apiClient"

type ApiResponse<T> = {
  data: T
  message: string
}

type UploadImagePayload = {
  file: File
  description?: string
  tags?: string[]
}

type UploadImageResponse = {
  url: string
}

export async function uploadImage(payload: UploadImagePayload) {
  const formData = new FormData()

  formData.append("file", payload.file)

  if (payload.description) {
    formData.append("description", payload.description)
  }

  payload.tags?.forEach((tag) => {
    formData.append("tags", tag)
  })

  const response = await apiFetch<ApiResponse<UploadImageResponse>>("/content/images", {
    method: "POST",
    body: formData,
  })

  return response.data
}
