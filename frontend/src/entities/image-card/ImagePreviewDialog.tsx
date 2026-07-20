import { Heart, MessageCircle, Send, X } from "lucide-react"
import type { ImageCardData } from "./ImageCard"
import { formatLikesCount, type LikeState } from "./imageCard.utils"
import styles from "./ImageCard.module.css"
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation("media")
  const description = image.description?.trim()
  const { liked, likesCount } = likeState

  return (
    <div
      className={styles.previewOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={t("preview.label")}
      onClick={onClose}
    >
      <div className={styles.previewPanel} onClick={(event) => event.stopPropagation()}>
        <button
          className={styles.closeButton}
          type="button"
          aria-label={t("preview.close")}
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </button>
        <div className={styles.previewFrame}>
          <div className={styles.previewMedia}>
            <img className={styles.previewImage} src={image.url} alt={imageAlt} decoding="async" />
          </div>

          <div className={styles.previewDetails}>
            <div className={styles.actions} aria-label={t("card.previewActions")}>
              <button
                className={`${styles.actionButton} ${liked ? styles.liked : ""}`}
                type="button"
                aria-label={liked ? t("card.removeLike") : t("card.like")}
                aria-pressed={liked}
                onClick={onToggleLike}
              >
                <Heart aria-hidden="true" />
                <span>{formatLikesCount(likesCount)}</span>
              </button>

              <button className={styles.iconButton} type="button" aria-label={t("card.openComments")}>
                <MessageCircle aria-hidden="true" />
              </button>

              <button
                className={styles.iconButton}
                type="button"
                aria-label={t("card.copyLink")}
                onClick={onCopyLink}
              >
                <Send aria-hidden="true" />
              </button>
            </div>

            {description && (
              <section className={styles.previewSection}>
                <h2>{t("preview.description")}</h2>
                <p className={styles.description}>{description}</p>
              </section>
            )}

            {previewTags.length > 0 && (
              <section className={styles.previewSection}>
                <h2>{t("preview.tags")}</h2>
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
