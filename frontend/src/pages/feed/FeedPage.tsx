import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { FeedList } from "@/features/feed/FeedList"
import { fetchPins } from "@/entities/pin/pin.api.ts"
import { getApiErrorMessage, logApiError } from "@/shared/api/errors/errorMapper"
import styles from "./FeedPage.module.css"


export const FeedPage = () => {
  const { data: pins = [], isError, error } = useQuery({
    queryKey: ["feed", "pins"],
    queryFn: fetchPins,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (isError) {
      logApiError("Could not load public feed", error)
    }
  }, [error, isError])

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.badge}>PinPet Gallery</div>
          <h1 className={styles.title}>Discover cozy pet inspiration</h1>
          <p className={styles.text}>
            Browse fresh uploads and AI-generated ideas in one soft little feed.
          </p>
        </div>
      </section>

      <section className={styles.container}>
        {isError ? (
          <div className={styles.error}>{getApiErrorMessage(error, "Feed is temporarily unavailable.")}</div>
        ) : (
          <FeedList pins={pins} />
        )}
      </section>
    </div>
  )
}
