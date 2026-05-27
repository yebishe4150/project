import type { ImageCardData } from "./ImageCard"

export type LikeState = Pick<ImageCardData, "liked" | "likesCount">

export function formatLikesCount(count: number) {
  if (count <= 9999) {
    return String(count)
  }

  const units = [
    { value: 1_000_000, suffix: "m" },
    { value: 1_000, suffix: "k" },
  ]
  const unit = units.find((item) => count >= item.value)

  if (!unit) {
    return String(count)
  }

  const value = count / unit.value
  const formatted = value >= 100 || Number.isInteger(value)
    ? Math.floor(value).toString()
    : value.toFixed(1).replace(".", ",").replace(",0", "")

  return `${formatted}${unit.suffix}`
}

export function toggleLikeState(state: LikeState): LikeState {
  const liked = !state.liked

  return {
    liked,
    likesCount: Math.max(0, state.likesCount + (liked ? 1 : -1)),
  }
}
