import type { Pin } from "../pinTypes"
import styles from "./PinCard.module.css"

export const PinCard = ({ pin }: { pin: Pin }) => {
  return (
<div className={styles.pinCard}>
      <img
        src={pin.imageUrl}
        alt=""
        className={styles.image}
        loading="lazy"
      />
    </div>
  )
}