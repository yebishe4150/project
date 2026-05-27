import { Heart, MessageCircle, Send } from "lucide-react"
import { useToast } from "@/app/providers/useToast"
import { ImagePreviewDialog } from "./ImagePreviewDialog"
import { formatLikesCount } from "./imageCard.utils"
import { useImageLike } from "./useImageLike"
import { useImagePreviewUrl } from "./useImagePreviewUrl"
import styles from "./ImageCard.module.css"

export type ImageCardData = {
  id: string
  url: string
  description?: string | null
  liked: boolean
  likesCount: number
}

type Props = {
  image: ImageCardData
  alt?: string
  imageClassName?: string
  previewTags?: string[]
  shareParams?: Record<string, string | null | undefined>
  onLikeChange?: (imageId: string, liked: boolean, likesCount: number) => void
}

export const ImageCard = ({
  image,
  alt,
  imageClassName,
  previewTags = [],
  shareParams,
  onLikeChange,
}: Props) => {
  const { showToast } = useToast()
  const { likeState, toggleLike } = useImageLike({ image, onLikeChange })
  const { closePreview, getPhotoPageUrl, isPreviewOpen, openPreview } = useImagePreviewUrl({
    imageId: image.id,
    shareParams,
  })
  const description = image.description?.trim()
  const imageAlt = alt ?? description ?? ""
  const { liked, likesCount } = likeState

  const copyImageLink = async () => {
    try {
      await navigator.clipboard.writeText(getPhotoPageUrl())
      showToast({
        title: "Link copied",
        message: "Photo link is ready to share.",
      })
    } catch {
      showToast({
        title: "Could not copy link",
        message: "The browser did not allow clipboard access.",
      })
    }
  }

  return (
    <>
      <figure className={styles.card}>
        <button
          className={styles.previewTrigger}
          type="button"
          aria-label="Open photo preview"
          onClick={openPreview}
        >
          <img
            className={`${styles.image} ${imageClassName ?? ""}`}
            src={image.url}
            alt={imageAlt}
            loading="lazy"
            decoding="async"
          />
        </button>

        <figcaption className={styles.caption}>
          <div className={styles.actions} aria-label="Photo actions">
            <button
              className={`${styles.actionButton} ${liked ? styles.liked : ""}`}
              type="button"
              aria-label={liked ? "Remove like" : "Like photo"}
              aria-pressed={liked}
              onClick={toggleLike}
            >
              <Heart aria-hidden="true" />
              <span>{formatLikesCount(likesCount)}</span>
            </button>

            <button className={styles.iconButton} type="button" aria-label="Open comments">
              <MessageCircle aria-hidden="true" />
            </button>

            <button
              className={styles.iconButton}
              type="button"
              aria-label="Copy photo link"
              onClick={copyImageLink}
            >
              <Send aria-hidden="true" />
            </button>
          </div>

          {description && <p className={styles.description}>{description}</p>}
        </figcaption>
      </figure>

      {isPreviewOpen && (
        <ImagePreviewDialog
          image={image}
          imageAlt={imageAlt}
          likeState={likeState}
          previewTags={previewTags}
          onClose={closePreview}
          onCopyLink={copyImageLink}
          onToggleLike={toggleLike}
        />
      )}
    </>
  )
}
