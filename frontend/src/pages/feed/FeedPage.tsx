import { useQuery } from "@tanstack/react-query"
import { FeedList } from "@/features/feed/FeedList"
import { fetchPins } from "@/entities/pin/pin.api.ts"
import styles from "./FeedPage.module.css"


export const FeedPage = () => {
  const { data: pins = [] } = useQuery({
    queryKey: ["feed", "pins"],
    queryFn: fetchPins,
    staleTime: 30_000,
  })

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
        <FeedList pins={pins} />
      </section>
    </div>
  )
}
