import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, Tag } from "lucide-react"
import { ImageCard } from "@/entities/image-card/ImageCard"
import { useInView } from "@/shared/lib/useInView"
import { logApiError } from "@/shared/api/errors/errorMapper"
import type { GalleryImage, GalleryTag } from "./gallery.api"
import {
  fetchGalleryCollectionImages,
  GALLERY_IMAGES_STALE_TIME,
  galleryImagesQueryKey,
  UNTAGGED_COLLECTION_ID,
} from "./galleryQuery"
import {
  formatTagName,
  getStableRandomPreviewImages,
  pluralizePhotos,
} from "./gallery.utils"
import styles from "./GalleryPage.module.css"

const DEFAULT_IMAGE_BATCH_SIZE = 24
const MIN_GRID_COLUMN_WIDTH = 240
const MOBILE_MIN_GRID_COLUMN_WIDTH = 120
const GRID_BATCH_ROWS = 4
const EMPTY_GALLERY_IMAGES: GalleryImage[] = []

type Props = {
  collection: GalleryTag
  isExpanded: boolean
  imageCount?: number
  onToggle: (collectionId: string) => void
  onImagesLoaded: (collectionId: string, imageCount: number) => void
  onLikeChange: (imageId: string, liked: boolean, likesCount: number) => void
}

export const CollectionCard = ({
  collection,
  isExpanded,
  imageCount,
  onToggle,
  onImagesLoaded,
  onLikeChange,
}: Props) => {
  const [cardRef, isCardInView] = useInView<HTMLElement>({ rootMargin: "200px" })
  const imageGridRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [imageBatchSize, setImageBatchSize] = useState(DEFAULT_IMAGE_BATCH_SIZE)
  const [visibleCount, setVisibleCount] = useState(DEFAULT_IMAGE_BATCH_SIZE)
  const collectionName = formatTagName(collection.name)
  const shouldLoadImages = isCardInView || isExpanded
  const imagesQuery = useQuery({
    queryKey: galleryImagesQueryKey(collection.id),
    queryFn: () => fetchGalleryCollectionImages(collection.id),
    enabled: shouldLoadImages,
    staleTime: GALLERY_IMAGES_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  })
  const images = imagesQuery.data ?? EMPTY_GALLERY_IMAGES
  const previewImages = useMemo(() => getStableRandomPreviewImages(images), [images])
  const renderedCount = Math.max(visibleCount, imageBatchSize)
  const visibleImages = useMemo(() => images.slice(0, renderedCount), [images, renderedCount])
  const hasMoreImages = renderedCount < images.length
  const displayedCount = imagesQuery.data ? images.length : imageCount

  useEffect(() => {
    if (imagesQuery.error) {
      logApiError(`Could not load gallery images for ${collection.name}`, imagesQuery.error)
    }
  }, [collection.name, imagesQuery.error])

  useEffect(() => {
    const imageGrid = imageGridRef.current

    if (!imageGrid) {
      return
    }

    const calculateBatchSize = (width: number) => {
      const minColumnWidth = window.matchMedia("(max-width: 560px)").matches
        ? MOBILE_MIN_GRID_COLUMN_WIDTH
        : MIN_GRID_COLUMN_WIDTH
      const columns = Math.max(1, Math.floor(width / minColumnWidth))

      return columns * GRID_BATCH_ROWS
    }

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) {
        return
      }

      setImageBatchSize(calculateBatchSize(entry.contentRect.width))
    })

    setImageBatchSize(calculateBatchSize(imageGrid.getBoundingClientRect().width))
    observer.observe(imageGrid)

    return () => {
      observer.disconnect()
    }
  }, [isExpanded])

  useEffect(() => {
    if (imagesQuery.data) {
      onImagesLoaded(collection.id, imagesQuery.data.length)
    }
  }, [collection.id, imagesQuery.data, onImagesLoaded])

  useEffect(() => {
    const sentinel = sentinelRef.current

    if (!sentinel || !hasMoreImages) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisibleCount((current) =>
            Math.min(Math.max(current, imageBatchSize) + imageBatchSize, images.length),
          )
        }
      },
      { rootMargin: "260px" },
    )

    observer.observe(sentinel)

    return () => {
      observer.unobserve(sentinel)
      observer.disconnect()
    }
  }, [hasMoreImages, imageBatchSize, images.length])

  return (
    <article
      ref={cardRef}
      className={`${styles.collectionCard} ${isExpanded ? styles.collectionCardExpanded : ""}`}
    >
      <button
        className={styles.collectionButton}
        type="button"
        aria-expanded={isExpanded}
        onClick={() => onToggle(collection.id)}
      >
        <div className={styles.previewGrid}>
          {previewImages.length > 0 ? (
            previewImages.map((image, index) => (
              <img
                className={styles.previewImage}
                src={image.url}
                alt=""
                key={`${image.id}-${index}`}
                loading="lazy"
                decoding="async"
              />
            ))
          ) : (
            <div className={styles.previewEmpty}>
              <Tag aria-hidden="true" />
            </div>
          )}
        </div>

        <div className={styles.cardMeta}>
          <div>
            <h2>{collectionName}</h2>
            <p>{displayedCount === undefined ? "Preview loads on view" : pluralizePhotos(displayedCount)}</p>
          </div>
          <ChevronDown className={styles.cardChevron} aria-hidden="true" />
        </div>
      </button>

      {isExpanded && (
        <div className={styles.expandedPanel}>
          {imagesQuery.isLoading ? (
            <div className={styles.emptyPanel}>Loading photos...</div>
          ) : images.length > 0 ? (
            <>
              <div ref={imageGridRef} className={styles.imageGrid}>
                {visibleImages.map((image, index) => (
                  <ImageCard
                    image={image}
                    imageClassName={styles.galleryImage}
                    alt={`${collectionName} ${index + 1}`}
                    previewTags={
                      collection.id === UNTAGGED_COLLECTION_ID
                        ? []
                        : [collectionName]
                    }
                    key={`${collection.id}-${image.id}`}
                    onLikeChange={onLikeChange}
                  />
                ))}
              </div>
              {hasMoreImages && <div ref={sentinelRef} className={styles.loadMoreSentinel} />}
            </>
          ) : (
            <div className={styles.emptyPanel}>No photos in this collection yet</div>
          )}
        </div>
      )}
    </article>
  )
}
