import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useQueries, useQuery } from "@tanstack/react-query"
import { ChevronDown, Filter, ImageOff, Info, Search, Tag } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { getApiErrorMessage, logApiError } from "@/shared/api/errors/errorMapper"
import {
  fetchAllGalleryImages,
  fetchGalleryImagesByTag,
  fetchGalleryTags,
  searchGalleryImages,
  type GalleryImage,
  type GalleryTag,
} from "./gallery.api"
import styles from "./GalleryPage.module.css"

type SortMode = "name" | "count"

type Collection = GalleryTag & {
  images: GalleryImage[]
}

const UNTAGGED_COLLECTION_ID = "__untagged"

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

function getPreviewImages(images: GalleryImage[]) {
  return images.slice(0, 3)
}

export const GalleryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedSearch = searchParams.get("search")?.trim() ?? ""
  const requestedTag = searchParams.get("tag")?.trim() ?? ""
  const [searchValue, setSearchValue] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>("name")
  const [suppressedAutoExpandKey, setSuppressedAutoExpandKey] = useState<string | null>(null)

  const tagsQuery = useQuery({
    queryKey: ["gallery", "tags"],
    queryFn: fetchGalleryTags,
    staleTime: 30_000,
  })

  const tags = tagsQuery.data ?? []
  const allImagesQuery = useQuery({
    queryKey: ["gallery", "all-images"],
    queryFn: fetchAllGalleryImages,
    staleTime: 30_000,
  })
  const imageQueries = useQueries({
    queries: tags.map((tag) => ({
      queryKey: ["gallery", "tag-images", tag.id],
      queryFn: () => fetchGalleryImagesByTag(tag.id),
      staleTime: 30_000,
    })),
  })

  const searchQuery = useQuery({
    queryKey: ["gallery", "search", requestedSearch],
    queryFn: () => searchGalleryImages(requestedSearch),
    enabled: requestedSearch.length > 0,
    staleTime: 30_000,
  })

  const collections = useMemo<Collection[]>(() => {
    const nextCollections = tags.map((tag, index) => ({
      ...tag,
      images: imageQueries[index]?.data ?? [],
    }))
    const taggedUrls = new Set(nextCollections.flatMap((collection) =>
      collection.images.map((image) => image.url),
    ))
    const untaggedImages = (allImagesQuery.data ?? []).filter((image) => !taggedUrls.has(image.url))
    const collectionsWithUntagged = untaggedImages.length > 0
      ? [
        ...nextCollections,
        {
          id: UNTAGGED_COLLECTION_ID,
          name: "untagged",
          images: untaggedImages,
        },
      ]
      : nextCollections

    return [...collectionsWithUntagged].sort((left, right) => {
      if (sortMode === "count") {
        return right.images.length - left.images.length || left.name.localeCompare(right.name)
      }

      return left.name.localeCompare(right.name)
    })
  }, [allImagesQuery.data, imageQueries, sortMode, tags])

  const matchingCollection = useMemo(() => {
    const normalizedSearch = requestedSearch.toLowerCase()
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
  }, [collections, requestedSearch, requestedTag])

  const searchCollection = useMemo<Collection | null>(() => {
    if (!requestedSearch || matchingCollection) {
      return null
    }

    return {
      id: "search-results",
      name: `Search: ${requestedSearch}`,
      images: searchQuery.data ?? [],
    }
  }, [matchingCollection, requestedSearch, searchQuery.data])

  const autoExpandKey = requestedTag
    ? `tag:${requestedTag.toLowerCase()}`
    : requestedSearch
      ? `search:${requestedSearch.toLowerCase()}`
      : null
  const autoExpandTargetId = matchingCollection?.id ?? searchCollection?.id ?? null

  useEffect(() => {
    if (!autoExpandKey) {
      setSuppressedAutoExpandKey(null)
      return
    }

    if (
      !autoExpandTargetId ||
      suppressedAutoExpandKey === autoExpandKey ||
      expandedId === autoExpandTargetId
    ) {
      return
    }

    setExpandedId(autoExpandTargetId)
  }, [autoExpandKey, autoExpandTargetId, expandedId, suppressedAutoExpandKey])

  const baseCollections = searchCollection ? [searchCollection, ...collections] : collections
  const expandedCollection = expandedId
    ? baseCollections.find((collection) => collection.id === expandedId) ?? null
    : null
  const visibleCollections = expandedCollection
    ? [
      expandedCollection,
      ...baseCollections.filter((collection) => collection.id !== expandedCollection.id),
    ]
    : baseCollections
  const isLoading = tagsQuery.isLoading || imageQueries.some((query) => query.isLoading) || allImagesQuery.isLoading
  const queryError =
    tagsQuery.error ??
    allImagesQuery.error ??
    searchQuery.error ??
    imageQueries.find((query) => query.error)?.error ??
    null
  const isQueryError = tagsQuery.isError || allImagesQuery.isError || searchQuery.isError || imageQueries.some((query) => query.isError)

  useEffect(() => {
    if (queryError) {
      logApiError("Could not load gallery data", queryError)
    }
  }, [queryError])

  const runSearch = () => {
    const nextValue = searchValue.trim()

    if (!nextValue) {
      setSearchParams({})
      return
    }

    setSuppressedAutoExpandKey(null)
    setSearchParams({ search: nextValue })
    setSearchValue("")
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    runSearch()
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Collections</h1>
          <p className={styles.subtitle}>Photos are grouped automatically by tags</p>
        </div>

        <div className={styles.toolbar}>
          <form className={styles.searchForm} onSubmit={submitSearch}>
            <Search aria-hidden="true" />
            <input
              type="search"
              aria-label="Search collections"
              placeholder="Search collections"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  runSearch()
                }
              }}
            />
          </form>

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
        {visibleCollections.map((collection) => {
          const isExpanded = expandedId === collection.id
          const previewImages = getPreviewImages(collection.images)

          return (
            <article
              className={`${styles.collectionCard} ${isExpanded ? styles.collectionCardExpanded : ""}`}
              key={collection.id}
            >
              <button
                className={styles.collectionButton}
                type="button"
                aria-expanded={isExpanded}
                onClick={() => toggleCollection(collection.id)}
              >
                <div className={styles.previewGrid}>
                  {previewImages.length > 0 ? (
                    previewImages.map((image, index) => (
                      <img
                        className={styles.previewImage}
                        src={image.url}
                        alt=""
                        key={`${image.url}-${index}`}
                        loading="lazy"
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
                    <h2>{formatTagName(collection.name)}</h2>
                    <p>{pluralizePhotos(collection.images.length)}</p>
                  </div>
                  <ChevronDown className={styles.cardChevron} aria-hidden="true" />
                </div>
              </button>

              {isExpanded && (
                <div className={styles.expandedPanel}>
                  {collection.images.length > 0 ? (
                    <div className={styles.imageGrid}>
                      {collection.images.map((image, index) => (
                        <img
                          className={styles.galleryImage}
                          src={image.url}
                          alt={`${formatTagName(collection.name)} ${index + 1}`}
                          key={`${collection.id}-${image.url}-${index}`}
                          loading="lazy"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyPanel}>No photos in this collection yet</div>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </section>}

      <footer className={styles.notice}>
        <Info aria-hidden="true" />
        <span>Collections update automatically when new photos are added</span>
      </footer>
    </div>
  )
}
