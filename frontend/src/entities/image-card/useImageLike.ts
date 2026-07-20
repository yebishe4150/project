import { useEffect, useRef, useState } from "react"
import { useToast } from "@/app/providers/useToast"
import { setImageLike } from "@/features/image-actions/api/imageLikes"
import type { ImageCardData } from "./ImageCard"
import { toggleLikeState, type LikeState } from "./imageCard.utils"
import { useTranslation } from "react-i18next"

type UseImageLikeOptions = {
  image: ImageCardData
  onLikeChange?: (imageId: string, liked: boolean, likesCount: number) => void
}

export function useImageLike({ image, onLikeChange }: UseImageLikeOptions) {
  const { t } = useTranslation("notifications")
  const { showToast } = useToast()
  const [likeState, setLikeState] = useState<LikeState>({
    liked: image.liked,
    likesCount: image.likesCount,
  })
  const isLikePending = useRef(false)

  useEffect(() => {
    setLikeState({
      liked: image.liked,
      likesCount: image.likesCount,
    })
  }, [image.liked, image.likesCount])

  const toggleLike = async () => {
    if (isLikePending.current) {
      return
    }

    const previousState = likeState
    const nextState = toggleLikeState(previousState)

    setLikeState(nextState)
    isLikePending.current = true

    try {
      const savedState = await setImageLike(image.id, nextState.liked)

      setLikeState(savedState)
      onLikeChange?.(image.id, savedState.liked, savedState.likesCount)
    } catch {
      setLikeState(previousState)
      showToast({
        title: t("like.saveFailed.title"),
        message: t("like.saveFailed.message"),
      })
    } finally {
      isLikePending.current = false
    }
  }

  return {
    likeState,
    toggleLike,
  }
}
