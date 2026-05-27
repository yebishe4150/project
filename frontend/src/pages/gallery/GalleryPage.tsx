import { useCallback, useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, Filter, ImageOff, Info } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { TagSearchBox } from "@/features/tag-search/TagSearchBox"
import { getApiErrorMessage, logApiError } from "@/shared/api/errors/errorMapper"
import { CollectionCard } from "./CollectionCard"
import { fetchGalleryTags, type GalleryTag } from "./gallery.api"
import { GALLERY_IMAGES_STALE_TIME, UNTAGGED_COLLECTION_ID } from "./galleryQuery"
import { formatTagName, isGalleryImageList } from "./gallery.utils"
import styles from "./GalleryPage.module.css"

type SortMode = "name" | "count"

type Collection = GalleryTag

const EMPTY_GALLERY_TAGS: GalleryTag[] = []

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
