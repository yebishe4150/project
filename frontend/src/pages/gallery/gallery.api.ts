import { apiFetch } from "@/shared/api/apiClient"
import { logApiError } from "@/shared/api/errors/errorMapper"

export type GalleryTag = {
  id: string
  name: string
}

export type GalleryImage = {
  id: string
  url: string
  description: string | null
  likesCount: number
  liked: boolean
}

type GalleryTagsResponse = {
  data: GalleryTag[]
  message: string
}

type GalleryImagesResponse = {
  data: GalleryImage[]
  message: string
}

type SearchImagesResponse = GalleryImagesResponse

type AllImagesResponse = GalleryImagesResponse

const DEV_TAGS: GalleryTag[] = [
  { id: "nature", name: "nature" },
  { id: "cats", name: "cats" },
  { id: "travel", name: "travel" },
  { id: "portraits", name: "portraits" },
  { id: "ai-art", name: "ai art" },
]

const DEV_IMAGES_BY_TAG: Record<string, GalleryImage[]> = {
  nature: [1015, 1016, 1018, 1025, 1036, 1043, 1056, 1069].map((id) => ({
    id: `dev-nature-${id}`,
    url: `https://picsum.photos/id/${id}/720/900`,
    description: null,
    likesCount: 0,
    liked: false,
  })),
  cats: [40, 219, 237, 433, 577, 593, 659, 718].map((id) => ({
    id: `dev-cats-${id}`,
    url: `https://picsum.photos/id/${id}/720/900`,
    description: null,
    likesCount: 0,
    liked: false,
  })),
  travel: [1031, 1033, 1040, 1050, 1057, 1067, 1071, 1080, 1084].map((id) => ({
    id: `dev-travel-${id}`,
    url: `https://picsum.photos/id/${id}/720/900`,
    description: null,
    likesCount: 0,
    liked: false,
  })),
  portraits: [1005, 1011, 1027, 1062, 1068, 1074].map((id) => ({
    id: `dev-portraits-${id}`,
    url: `https://picsum.photos/id/${id}/720/900`,
    description: null,
    likesCount: 0,
    liked: false,
  })),
  "ai-art": [1019, 1024, 1039, 1041, 1052, 1060].map((id) => ({
    id: `dev-ai-art-${id}`,
    url: `https://picsum.photos/id/${id}/720/900`,
    description: null,
    likesCount: 0,
    liked: false,
  })),
}

const DEV_UNTAGGED_IMAGES: GalleryImage[] = [20, 42, 96, 152, 180].map((id) => ({
  id: `dev-untagged-${id}`,
  url: `https://picsum.photos/id/${id}/720/900`,
  description: null,
  likesCount: 0,
  liked: false,
}))

const DEV_LIKES_STORAGE_KEY = "pinpet-dev-image-likes"

function getDevLikeState(imageId: string): Pick<GalleryImage, "liked" | "likesCount"> {
  try {
    const likes = JSON.parse(window.localStorage.getItem(DEV_LIKES_STORAGE_KEY) ?? "{}") as Record<
      string,
      Pick<GalleryImage, "liked" | "likesCount">
    >

    return likes[imageId] ?? { liked: false, likesCount: 0 }
  } catch {
    return { liked: false, likesCount: 0 }
  }
}

function withDevLikeState(image: GalleryImage): GalleryImage {
  return {
    ...image,
    ...getDevLikeState(image.id),
  }
}

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
  return (DEV_IMAGES_BY_TAG[tagId] ?? []).map(withDevLikeState)
}

export async function fetchGalleryTags(): Promise<GalleryTag[]> {
  try {
    const response = await withDevTimeout(apiFetch<GalleryTagsResponse>("/content/gallery/tags"))

    return response.data
  } catch (error) {
    if (import.meta.env.DEV) {
      logApiError("Could not load gallery tags, using dev fallback", error, "warn")
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
      logApiError(`Could not load gallery images for tag ${tagId}, using dev fallback`, error, "warn")
      return getDevImages(tagId)
    }

    throw error
  }
}

export async function fetchAllGalleryImages(): Promise<GalleryImage[]> {
  try {
    const response = await withDevTimeout(apiFetch<AllImagesResponse>("/content"))

    return response.data
  } catch (error) {
    if (import.meta.env.DEV) {
      logApiError("Could not load all gallery images, using dev fallback", error, "warn")
      return [...Object.values(DEV_IMAGES_BY_TAG).flat(), ...DEV_UNTAGGED_IMAGES].map(withDevLikeState)
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

    return response.data
  } catch (error) {
    if (import.meta.env.DEV) {
      logApiError("Could not search gallery images, using dev fallback", error, "warn")
      const normalized = tags.map((tag) => tag.toLowerCase())
      const matched = DEV_TAGS.filter((tag) =>
        normalized.some((searchTag) => tag.name.includes(searchTag)),
      )

      return matched.flatMap((tag) => getDevImages(tag.id))
    }

    throw error
  }
}
