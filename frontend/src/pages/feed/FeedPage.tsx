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
    <div className={styles.container}>
      <FeedList pins={pins} />
    </div>
  )
}
