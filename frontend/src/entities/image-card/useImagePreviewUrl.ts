import { useCallback, useEffect, useState } from "react"
import { useLocation, useSearchParams } from "react-router-dom"

type UseImagePreviewUrlOptions = {
  imageId: string
  shareParams?: Record<string, string | null | undefined>
}

export function useImagePreviewUrl({ imageId, shareParams }: UseImagePreviewUrlOptions) {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const applyShareParams = useCallback((nextParams: URLSearchParams) => {
    Object.entries(shareParams ?? {}).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value)
      } else {
        nextParams.delete(key)
      }
    })
  }, [shareParams])

  const getPhotoPageUrl = () => {
    const nextParams = new URLSearchParams(searchParams)

    applyShareParams(nextParams)
    nextParams.set("photo", imageId)
    const query = nextParams.toString()

    return `${window.location.origin}${location.pathname}${query ? `?${query}` : ""}${location.hash}`
  }

  const openPreview = () => {
    const nextParams = new URLSearchParams(searchParams)

    applyShareParams(nextParams)
    nextParams.set("photo", imageId)
    setSearchParams(nextParams)
    setIsPreviewOpen(true)
  }

  const closePreview = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams)

    if (nextParams.get("photo") === imageId) {
      nextParams.delete("photo")
      setSearchParams(nextParams, { replace: true })
    }

    setIsPreviewOpen(false)
  }, [imageId, searchParams, setSearchParams])

  useEffect(() => {
    setIsPreviewOpen(searchParams.get("photo") === imageId)
  }, [imageId, searchParams])

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

  return {
    closePreview,
    getPhotoPageUrl,
    isPreviewOpen,
    openPreview,
  }
}
