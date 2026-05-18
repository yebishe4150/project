import { apiFetch } from "@/shared/api/apiClient"

export type GalleryTag = {
  id: string
  name: string
}

export type GalleryImage = {
  url: string
}

type GalleryTagsResponse = {
  data: GalleryTag[]
  message: string
}

type GalleryImagesResponse = {
  data: GalleryImage[]
  message: string
}

type SearchImagesResponse = {
  data: Array<GalleryImage & { id?: string }>
  message: string
}

type AllImagesResponse = {
  data: Array<GalleryImage & { id?: string }>
  message: string
}

const DEV_TAGS: GalleryTag[] = [
  { id: "nature", name: "nature" },
  { id: "cats", name: "cats" },
  { id: "travel", name: "travel" },
  { id: "portraits", name: "portraits" },
  { id: "ai-art", name: "ai art" },
]

const DEV_IMAGES_BY_TAG: Record<string, GalleryImage[]> = {
  nature: [1015, 1016, 1018, 1025, 1036, 1043, 1056, 1069].map((id) => ({
    url: `https://picsum.photos/id/${id}/720/900`,
  })),
  cats: [40, 219, 237, 433, 577, 593, 659, 718].map((id) => ({
    url: `https://picsum.photos/id/${id}/720/900`,
  })),
  travel: [1031, 1033, 1040, 1050, 1057, 1067, 1071, 1080, 1084].map((id) => ({
    url: `https://picsum.photos/id/${id}/720/900`,
  })),
  portraits: [1005, 1011, 1027, 1062, 1068, 1074].map((id) => ({
    url: `https://picsum.photos/id/${id}/720/900`,
  })),
  "ai-art": [1019, 1024, 1039, 1041, 1052, 1060].map((id) => ({
    url: `https://picsum.photos/id/${id}/720/900`,
  })),
}

const DEV_UNTAGGED_IMAGES: GalleryImage[] = [20, 42, 96, 152, 180].map((id) => ({
  url: `https://picsum.photos/id/${id}/720/900`,
}))

async function withDevTimeout<T>(request: Promise<T>): Promise<T> {
  if (!import.meta.env.DEV) {
    return request
  }

  return Promise.race([
    request,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error("Gallery dev fallback timeout")), 1500)
    }),
  ])
}

function getDevImages(tagId: string): GalleryImage[] {
  return DEV_IMAGES_BY_TAG[tagId] ?? []
}

export async function fetchGalleryTags(): Promise<GalleryTag[]> {
  try {
    const response = await withDevTimeout(apiFetch<GalleryTagsResponse>("/content/gallery/tags"))

    return response.data
  } catch (error) {
    if (import.meta.env.DEV) {
      return DEV_TAGS
    }

    throw error
  }
}

export async function fetchGalleryImagesByTag(tagId: string): Promise<GalleryImage[]> {
  try {
    const response = await withDevTimeout(
      apiFetch<GalleryImagesResponse>(`/content/gallery/tags/${tagId}/images`),
    )

    return response.data
  } catch (error) {
    if (import.meta.env.DEV) {
      return getDevImages(tagId)
    }

    throw error
  }
}

export async function fetchAllGalleryImages(): Promise<GalleryImage[]> {
  try {
    const response = await withDevTimeout(apiFetch<AllImagesResponse>("/content"))

    return response.data.map((image) => ({ url: image.url }))
  } catch (error) {
    if (import.meta.env.DEV) {
      return [...Object.values(DEV_IMAGES_BY_TAG).flat(), ...DEV_UNTAGGED_IMAGES]
    }

    throw error
  }
}

export async function searchGalleryImages(searchValue: string): Promise<GalleryImage[]> {
  const tags = searchValue
    .split(/[,\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)

  if (tags.length === 0) {
    return []
  }

  const params = new URLSearchParams()
  tags.forEach((tag) => params.append("tags", tag))

  try {
    const response = await withDevTimeout(
      apiFetch<SearchImagesResponse>(`/content/search?${params.toString()}`),
    )

    return response.data.map((image) => ({ url: image.url }))
  } catch (error) {
    if (import.meta.env.DEV) {
      const normalized = tags.map((tag) => tag.toLowerCase())
      const matched = DEV_TAGS.filter((tag) =>
        normalized.some((searchTag) => tag.name.includes(searchTag)),
      )

      return matched.flatMap((tag) => getDevImages(tag.id))
    }

    throw error
  }
}
