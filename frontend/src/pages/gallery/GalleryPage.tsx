import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, Filter, ImageOff, Info, Tag } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { ImageCard } from "@/entities/image-card/ImageCard"
import { TagSearchBox } from "@/features/tag-search/TagSearchBox"
import { useInView } from "@/shared/lib/useInView"
import { getApiErrorMessage, logApiError } from "@/shared/api/errors/errorMapper"
import {
  fetchGalleryTags,
  type GalleryImage,
  type GalleryTag,
} from "./gallery.api"
import {
  fetchGalleryCollectionImages,
  GALLERY_IMAGES_STALE_TIME,
  galleryImagesQueryKey,
  UNTAGGED_COLLECTION_ID,
} from "./galleryQuery"
import styles from "./GalleryPage.module.css"

type SortMode = "name" | "count"

type Collection = GalleryTag

function formatTagName(name: string) {
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

function pluralizePhotos(count: number) {
  return `${count} ${count === 1 ? "photo" : "photos"}`
}

function getStableRandomPreviewImages(images: GalleryImage[]) {
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

function isGalleryImageList(value: unknown): value is GalleryImage[] {
  return Array.isArray(value) && value.every((item) =>
    typeof item === "object" &&
    item !== null &&
    "id" in item &&
    "url" in item &&
    "liked" in item &&
    "likesCount" in item,
  )
}

const DEFAULT_IMAGE_BATCH_SIZE = 24
const MIN_GRID_COLUMN_WIDTH = 240
const MOBILE_MIN_GRID_COLUMN_WIDTH = 120
const GRID_BATCH_ROWS = 4
const EMPTY_GALLERY_IMAGES: GalleryImage[] = []
const EMPTY_GALLERY_TAGS: GalleryTag[] = []

type CollectionCardProps = {
  collection: Collection
  isExpanded: boolean
  imageCount?: number
  onToggle: (collectionId: string) => void
  onImagesLoaded: (collectionId: string, imageCount: number) => void
  onLikeChange: (imageId: string, liked: boolean, likesCount: number) => void
}

const CollectionCard = ({
  collection,
  isExpanded,
  imageCount,
  onToggle,
  onImagesLoaded,
  onLikeChange,
}: CollectionCardProps) => {
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

export const GalleryPage = () => {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedSearch = searchParams.get("search")?.trim() ?? ""
  const requestedTag = searchParams.get("tag")?.trim() ?? ""
  const [debouncedSearchValue, setDebouncedSearchValue] = useState(requestedTag || requestedSearch)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>("name")
  const [suppressedAutoExpandKey, setSuppressedAutoExpandKey] = useState<string | null>(null)
  const [collectionImageCounts, setCollectionImageCounts] = useState<Record<string, number>>({})

  const tagsQuery = useQuery({
    queryKey: ["gallery", "tags"],
    queryFn: fetchGalleryTags,
    staleTime: GALLERY_IMAGES_STALE_TIME,
    refetchOnWindowFocus: false,
  })

  const tags = tagsQuery.data ?? EMPTY_GALLERY_TAGS
  const activeSearchTerm = debouncedSearchValue.trim()

  const collections = useMemo<Collection[]>(() => {
    const normalizedSearch = activeSearchTerm.toLowerCase()
    const untaggedCollection: Collection = {
      id: UNTAGGED_COLLECTION_ID,
      name: "untagged",
    }
    const filteredTags = normalizedSearch
      ? tags.filter((tag) => tag.name.toLowerCase().includes(normalizedSearch))
      : tags
    const shouldShowUntagged = !normalizedSearch || untaggedCollection.name.includes(normalizedSearch)
    const nextCollections = shouldShowUntagged
      ? [...filteredTags, untaggedCollection]
      : filteredTags

    return [...nextCollections].sort((left, right) => {
      if (sortMode === "count") {
        return (collectionImageCounts[right.id] ?? 0) - (collectionImageCounts[left.id] ?? 0) ||
          left.name.localeCompare(right.name)
      }

      return left.name.localeCompare(right.name)
    })
  }, [activeSearchTerm, collectionImageCounts, sortMode, tags])

  const matchingCollection = useMemo(() => {
    const normalizedSearch = activeSearchTerm.toLowerCase()
    const normalizedTag = requestedTag.toLowerCase()

    if (normalizedTag) {
      return collections.find((collection) => collection.name.toLowerCase() === normalizedTag)
    }

    if (!normalizedSearch) {
      return null
    }

    return collections.find((collection) => {
      const name = collection.name.toLowerCase()

      return name === normalizedSearch || name.includes(normalizedSearch)
    }) ?? null
  }, [activeSearchTerm, collections, requestedTag])

  const autoExpandKey = requestedTag
    ? `tag:${requestedTag.toLowerCase()}`
    : activeSearchTerm
      ? `search:${activeSearchTerm.toLowerCase()}`
      : null
  const autoExpandTargetId = matchingCollection?.id ?? null

  useEffect(() => {
    if (!autoExpandKey) {
      const timeoutId = window.setTimeout(() => setSuppressedAutoExpandKey(null), 0)

      return () => {
        window.clearTimeout(timeoutId)
      }
    }

    if (
      !autoExpandTargetId ||
      suppressedAutoExpandKey === autoExpandKey ||
      expandedId === autoExpandTargetId
    ) {
      return
    }

    const timeoutId = window.setTimeout(() => setExpandedId(autoExpandTargetId), 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [autoExpandKey, autoExpandTargetId, expandedId, suppressedAutoExpandKey])

  const baseCollections = collections
  const expandedCollection = expandedId
    ? baseCollections.find((collection) => collection.id === expandedId) ?? null
    : null
  const visibleCollections = expandedCollection
    ? [
      expandedCollection,
      ...baseCollections.filter((collection) => collection.id !== expandedCollection.id),
    ]
    : baseCollections

  const isLoading = tagsQuery.isLoading
  const queryError = tagsQuery.error
  const isQueryError = tagsQuery.isError

  useEffect(() => {
    if (queryError) {
      logApiError("Could not load gallery data", queryError)
    }
  }, [queryError])

  const handleDebouncedSearchChange = useCallback((nextValue: string) => {
    setDebouncedSearchValue(nextValue)
    setSuppressedAutoExpandKey(null)
  }, [])

  const runSearch = (searchTerm: string) => {
    const nextValue = searchTerm.trim()

    if (!nextValue) {
      setSearchParams({})
      return
    }

    setSuppressedAutoExpandKey(null)
    setSearchParams({ search: nextValue })
  }

  const toggleCollection = (collectionId: string) => {
    setExpandedId((current) => {
      if (current !== collectionId) {
        return collectionId
      }

      if (autoExpandKey && autoExpandTargetId === collectionId) {
        setSuppressedAutoExpandKey(autoExpandKey)
      }

      return null
    })
  }

  const selectTagSuggestion = (tag: GalleryTag) => {
    setDebouncedSearchValue(tag.name)
    setSuppressedAutoExpandKey(null)
    setExpandedId(tag.id)
    setSearchParams({ tag: tag.name })
  }

  const handleImagesLoaded = useCallback((collectionId: string, imageCount: number) => {
    setCollectionImageCounts((current) => {
      if (current[collectionId] === imageCount) {
        return current
      }

      return {
        ...current,
        [collectionId]: imageCount,
      }
    })
  }, [])

  const updateImageLike = (imageId: string, liked: boolean, likesCount: number) => {
    queryClient.setQueriesData<unknown>({ queryKey: ["gallery-images"] }, (current: unknown) => {
      if (!isGalleryImageList(current)) {
        return current
      }

      return current.map((image) =>
        image.id === imageId
          ? {
            ...image,
            liked,
            likesCount,
          }
          : image,
      )
    })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Collections</h1>
          <p className={styles.subtitle}>Photos are grouped automatically by tags</p>
        </div>

        <div className={styles.toolbar}>
          <TagSearchBox
            initialValue={requestedTag ? formatTagName(requestedTag) : requestedSearch}
            onDebouncedSearchChange={handleDebouncedSearchChange}
            onSearchSubmit={runSearch}
            onTagSelect={selectTagSuggestion}
          />

          <label className={styles.sortControl}>
            <Filter aria-hidden="true" />
            <span>Sort</span>
            <select
              aria-label="Sort collections"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
            >
              <option value="name">Name</option>
              <option value="count">Photo count</option>
            </select>
            <ChevronDown aria-hidden="true" />
          </label>
        </div>
      </header>

      {isLoading && <div className={styles.state}>Loading collections...</div>}

      {!isLoading && isQueryError && (
        <div className={styles.empty}>
          <ImageOff aria-hidden="true" />
          <span>{getApiErrorMessage(queryError, "Could not load gallery. Please try again.")}</span>
        </div>
      )}

      {!isLoading && !isQueryError && visibleCollections.length === 0 && (
        <div className={styles.empty}>
          <ImageOff aria-hidden="true" />
          <span>No collections yet</span>
        </div>
      )}

      {!isQueryError && <section className={styles.collections} aria-label="Gallery collections">
        {visibleCollections.map((collection) => (
          <CollectionCard
            collection={collection}
            imageCount={collectionImageCounts[collection.id]}
            isExpanded={expandedId === collection.id}
            key={collection.id}
            onImagesLoaded={handleImagesLoaded}
            onLikeChange={updateImageLike}
            onToggle={toggleCollection}
          />
        ))}
      </section>}

      <footer className={styles.notice}>
        <Info aria-hidden="true" />
        <span>Collections update automatically when new photos are added</span>
      </footer>
    </div>
  )
}
