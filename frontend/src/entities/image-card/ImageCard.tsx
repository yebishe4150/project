import { useCallback, useEffect, useRef, useState } from "react"
import { Heart, MessageCircle, Send, X } from "lucide-react"
import { useLocation, useSearchParams } from "react-router-dom"
import { useToast } from "@/app/providers/useToast"
import { setImageLike } from "@/features/image-actions/api/imageLikes"
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

type LikeState = Pick<ImageCardData, "liked" | "likesCount">

function formatLikesCount(count: number) {
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

function toggleLikeState(state: LikeState): LikeState {
  const liked = !state.liked

  return {
    liked,
    likesCount: Math.max(0, state.likesCount + (liked ? 1 : -1)),
  }
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
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [likeState, setLikeState] = useState<LikeState>({
    liked: image.liked,
    likesCount: image.likesCount,
  })
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const isLikePending = useRef(false)
  const description = image.description?.trim()
  const imageAlt = alt ?? description ?? ""
  const { liked, likesCount } = likeState

  const getPhotoPageUrl = () => {
    const nextParams = new URLSearchParams(searchParams)

    Object.entries(shareParams ?? {}).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value)
      } else {
        nextParams.delete(key)
      }
    })

    nextParams.set("photo", image.id)
    const query = nextParams.toString()

    return `${window.location.origin}${location.pathname}${query ? `?${query}` : ""}${location.hash}`
  }

  const openPreview = () => {
    const nextParams = new URLSearchParams(searchParams)

    Object.entries(shareParams ?? {}).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value)
      } else {
        nextParams.delete(key)
      }
    })

    nextParams.set("photo", image.id)
    setSearchParams(nextParams)
    setIsPreviewOpen(true)
  }

  const closePreview = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams)

    if (nextParams.get("photo") === image.id) {
      nextParams.delete("photo")
      setSearchParams(nextParams, { replace: true })
    }

    setIsPreviewOpen(false)
  }, [image.id, searchParams, setSearchParams])

  useEffect(() => {
    setLikeState({
      liked: image.liked,
      likesCount: image.likesCount,
    })
  }, [image.liked, image.likesCount])

  useEffect(() => {
    setIsPreviewOpen(searchParams.get("photo") === image.id)
  }, [image.id, searchParams])

  useEffect(() => {
    if (!isPreviewOpen) {
      return
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePreview()
      }
    }

    document.addEventListener("keydown", closeOnEscape)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", closeOnEscape)
      document.body.style.overflow = previousOverflow
    }
  }, [isPreviewOpen, closePreview])

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
        title: "Like was not saved",
        message: "Please try again in a moment.",
      })
    } finally {
      isLikePending.current = false
    }
  }

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
        <div
          className={styles.previewOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Photo preview"
          onClick={closePreview}
        >
          <div className={styles.previewPanel} onClick={(event) => event.stopPropagation()}>
            <button
              className={styles.closeButton}
              type="button"
              aria-label="Close photo preview"
              onClick={closePreview}
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
      )}
    </>
  )
}
