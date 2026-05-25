import { createConcurrencyLimiter } from "@/shared/lib/createConcurrencyLimiter"
import {
  fetchAllGalleryImages,
  fetchGalleryImagesByTag,
  type GalleryImage,
} from "./gallery.api"

export const UNTAGGED_COLLECTION_ID = "__untagged"
export const GALLERY_IMAGES_STALE_TIME = 5 * 60 * 1000

export const galleryImagesQueryKey = (collectionId: string) =>
  ["gallery-images", collectionId] as const

const limitGalleryImageRequest = createConcurrencyLimiter(3)

export function fetchGalleryCollectionImages(collectionId: string): Promise<GalleryImage[]> {
  return limitGalleryImageRequest(() => {
    if (collectionId === UNTAGGED_COLLECTION_ID) {
      return fetchAllGalleryImages()
    }

    return fetchGalleryImagesByTag(collectionId)
  })
}
