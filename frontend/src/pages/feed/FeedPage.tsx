import { useEffect, useState } from "react"
import { FeedList } from "@/features/feed/FeedList"
import { fetchPins } from "../../entities/pin/pin.api"
import type { Pin } from "@/entities/pinTypes"
import styles from "./FeedPage.module.css"


export const FeedPage = () => {
  const [pins, setPins] = useState<Pin[]>([])

  useEffect(() => {
    fetchPins().then((data) => {
      setPins(data.items)
    })
  }, [])

  return (
    <div className={styles.container}>
      <FeedList pins={pins} />
    </div>
  )
}