import { useEffect, useRef, useState, type RefObject } from "react"

type UseInViewOptions = {
  rootMargin?: string
  threshold?: number
  freezeOnceVisible?: boolean
}

export function useInView<T extends Element>({
  rootMargin = "0px",
  threshold = 0,
  freezeOnceVisible = true,
}: UseInViewOptions = {}): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = ref.current

    if (!element || (freezeOnceVisible && isInView)) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return
        }

        setIsInView(entry.isIntersecting)
      },
      {
        rootMargin,
        threshold,
      },
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
      observer.disconnect()
    }
  }, [freezeOnceVisible, isInView, rootMargin, threshold])

  return [ref, isInView]
}
