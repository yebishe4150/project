import type { GalleryImage } from "./gallery.api"

export function formatTagName(name: string) {
  const trimmed = name.trim()

  if (/^(untagged|without-tags|without tags|no-tags|no tags)$/i.test(trimmed)) {
    return "Untagged"
  }

  return trimmed
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function pluralizePhotos(count: number) {
  return `${count} ${count === 1 ? "photo" : "photos"}`
}

export function getStableRandomPreviewImages(images: GalleryImage[]) {
  const shuffledImages = [...images]

  for (let index = shuffledImages.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const currentImage = shuffledImages[index]
    const randomImage = shuffledImages[randomIndex]

    if (!currentImage || !randomImage) {
      continue
    }

    shuffledImages[index] = randomImage
    shuffledImages[randomIndex] = currentImage
  }

  return shuffledImages.slice(0, 3)
}

export function isGalleryImageList(value: unknown): value is GalleryImage[] {
  return Array.isArray(value) && value.every((item) =>
    typeof item === "object" &&
    item !== null &&
    "id" in item &&
    "url" in item &&
    "liked" in item &&
    "likesCount" in item,
  )
}
