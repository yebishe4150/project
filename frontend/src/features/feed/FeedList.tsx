import type { Pin } from "@/entities/pinTypes"
import { PinCard } from "../../entities/pin/PinCard"
import styles from "./FeedList.module.css"

export const FeedList = ({ pins }: { pins: Pin[] }) => {
  return (
    <div className={styles.feedList}>
      {pins.map((pin) => (
        <PinCard key={pin.id} pin={pin} />
      ))}
    </div>
  )
}