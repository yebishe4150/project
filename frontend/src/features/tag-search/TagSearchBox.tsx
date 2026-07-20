import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Search, Tag } from "lucide-react"
import {
  fetchGalleryTags,
  type GalleryTag,
} from "@/pages/gallery/gallery.api"
import styles from "./TagSearchBox.module.css"
import { useTranslation } from "react-i18next"

type Variant = "gallery" | "header" | "sideNav"

type TagSearchBoxProps = {
  initialValue?: string
  placeholder?: string
  variant?: Variant
  onDebouncedSearchChange?: (searchValue: string) => void
  onSearchSubmit?: (searchValue: string) => void
  onTagSelect?: (tag: GalleryTag) => void
  onComplete?: () => void
  autoFocus?: boolean
}

const DEBOUNCE_DELAY = 350

function formatTagName(name: string) {
  return name
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export const TagSearchBox = ({
  initialValue = "",
  placeholder,
  variant = "gallery",
  onDebouncedSearchChange,
  onSearchSubmit,
  onTagSelect,
  onComplete,
  autoFocus = false,
}: TagSearchBoxProps) => {
  const { t } = useTranslation(["common", "gallery"])
  const resolvedPlaceholder = placeholder ?? t("gallery:searchPlaceholder")
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [searchValue, setSearchValue] = useState(initialValue)
  const [debouncedSearchValue, setDebouncedSearchValue] = useState(initialValue)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const activeSearchTerm = debouncedSearchValue.trim()

  const tagsQuery = useQuery({
    queryKey: ["gallery", "tags"],
    queryFn: fetchGalleryTags,
    staleTime: 30_000,
  })

  const tagSuggestions = useMemo(() => {
    const normalizedSearch = activeSearchTerm.toLowerCase()

    if (!normalizedSearch) {
      return []
    }

    return (tagsQuery.data ?? [])
      .filter((tag) => tag.name.toLowerCase().includes(normalizedSearch))
      .sort((left, right) => {
        const leftStartsWithSearch = left.name.toLowerCase().startsWith(normalizedSearch)
        const rightStartsWithSearch = right.name.toLowerCase().startsWith(normalizedSearch)

        if (leftStartsWithSearch !== rightStartsWithSearch) {
          return leftStartsWithSearch ? -1 : 1
        }

        return left.name.localeCompare(right.name)
      })
      .slice(0, 6)
  }, [activeSearchTerm, tagsQuery.data])

  const showSuggestions = isSuggestionsOpen && searchValue.trim().length > 0

  useEffect(() => {
    setSearchValue(initialValue)
    setDebouncedSearchValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus()
    }
  }, [autoFocus])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextValue = searchValue.trim()

      setDebouncedSearchValue(nextValue)
      onDebouncedSearchChange?.(nextValue)
    }, DEBOUNCE_DELAY)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [onDebouncedSearchChange, searchValue])

  const submitSearch = () => {
    const nextValue = searchValue.trim()

    setIsSuggestionsOpen(false)
    onSearchSubmit?.(nextValue)

    if (!onSearchSubmit) {
      navigate(nextValue ? `/gallery?search=${encodeURIComponent(nextValue)}` : "/gallery")
    }

    onComplete?.()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitSearch()
  }

  const selectTagSuggestion = (tag: GalleryTag) => {
    setSearchValue(formatTagName(tag.name))
    setDebouncedSearchValue(tag.name)
    setIsSuggestionsOpen(false)
    onTagSelect?.(tag)

    if (!onTagSelect) {
      navigate(`/gallery?tag=${encodeURIComponent(tag.name)}`)
    }

    onComplete?.()
  }

  return (
    <div className={`${styles.searchBox} ${styles[variant]}`}>
      <form className={styles.searchForm} onSubmit={handleSubmit}>
        <Search aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          aria-label={t("common:search.searchByTag")}
          placeholder={resolvedPlaceholder}
          value={searchValue}
          onChange={(event) => {
            setSearchValue(event.target.value)
            setIsSuggestionsOpen(true)
          }}
          onFocus={() => setIsSuggestionsOpen(true)}
          onBlur={() => window.setTimeout(() => setIsSuggestionsOpen(false), 120)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              submitSearch()
            }
          }}
        />
      </form>

      {showSuggestions && (
        <div className={styles.suggestions} role="listbox" aria-label={t("common:search.suggestionsLabel")}>
          {tagsQuery.isFetching && (
            <div className={styles.suggestionStatus}>{t("common:search.searching")}</div>
          )}

          {!tagsQuery.isFetching && activeSearchTerm && (
            <button
              className={styles.suggestionItem}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={submitSearch}
            >
              <Search aria-hidden="true" />
              <span>{t("common:search.searchFor", { term: activeSearchTerm })}</span>
            </button>
          )}

          {tagSuggestions.map((tag) => (
            <button
              className={styles.suggestionItem}
              type="button"
              role="option"
              key={tag.id}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectTagSuggestion(tag)}
            >
              <Tag aria-hidden="true" />
              <span>{formatTagName(tag.name)}</span>
            </button>
          ))}

          {!tagsQuery.isFetching && tagSuggestions.length === 0 && (
            <div className={styles.suggestionStatus}>{t("common:search.noMatchingTags")}</div>
          )}
        </div>
      )}
    </div>
  )
}
