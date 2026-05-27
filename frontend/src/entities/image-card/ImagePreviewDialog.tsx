import { Heart, MessageCircle, Send, X } from "lucide-react"
import type { ImageCardData } from "./ImageCard"
import { formatLikesCount, type LikeState } from "./imageCard.utils"
import styles from "./ImageCard.module.css"

type Props = {
  image: ImageCardData
  imageAlt: string
  likeState: LikeState
  previewTags: string[]
  onClose: () => void
  onCopyLink: () => void
  onToggleLike: () => void
}

export const ImagePreviewDialog = ({
  image,
  imageAlt,
  likeState,
  previewTags,
  onClose,
  onCopyLink,
  onToggleLike,
}: Props) => {
  const description = image.description?.trim()
  const { liked, likesCount } = likeState

  return (
    <div
      className={styles.previewOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Photo preview"
      onClick={onClose}
    >
      <div className={styles.previewPanel} onClick={(event) => event.stopPropagation()}>
        <button
          className={styles.closeButton}
          type="button"
          aria-label="Close photo preview"
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </button>
        <div className={styles.previewFrame}>
          <div className={styles.previewMedia}>
            <img className={styles.previewImage} src={image.url} alt={imageAlt} decoding="async" />
          </div>

          <div className={styles.previewDetails}>
            <div className={styles.actions} aria-label="Preview photo actions">
              <button
                className={`${styles.actionButton} ${liked ? styles.liked : ""}`}
                type="button"
                aria-label={liked ? "Remove like" : "Like photo"}
                aria-pressed={liked}
                onClick={onToggleLike}
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
                onClick={onCopyLink}
              >
                <Send aria-hidden="true" />
              </button>
            </div>

            {description && (
              <section className={styles.previewSection}>
                <h2>Description</h2>
                <p className={styles.description}>{description}</p>
              </section>
            )}

            {previewTags.length > 0 && (
              <section className={styles.previewSection}>
                <h2>Tags</h2>
                <div className={styles.tagList}>
                  {previewTags.map((tag) => (
                    <span className={styles.tag} key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
