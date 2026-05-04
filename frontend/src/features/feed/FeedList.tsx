import type { CSSProperties } from "react"
import type { Pin } from "@/entities/pinTypes"
import { PinCard } from "../../entities/pin/PinCard"
import styles from "./FeedList.module.css"

const MIN_PINS_PER_ROW_LOOP = 8

function buildLoopSegment(rowPins: Pin[]) {
  const repeatCount = Math.max(1, Math.ceil(MIN_PINS_PER_ROW_LOOP / rowPins.length))

  return Array.from({ length: repeatCount }).flatMap(() => rowPins)
}

export const FeedList = ({ pins }: { pins: Pin[] }) => {
  if (pins.length === 0) {
    return <div className={styles.empty}>No images yet</div>
  }

  const rows = [0, 1].map((rowIndex) =>
    pins.filter((_, index) => index % 2 === rowIndex),
  )
  const populatedRows = rows.filter((rowPins) => rowPins.length > 0)

  return (
    <div className={styles.feedViewport} aria-label="Public feed">
      {populatedRows.map((rowPins, rowIndex) => {
        const loopSegment = buildLoopSegment(rowPins)

        return (
          <div
            className={`${styles.feedTrack} ${rowIndex % 2 === 1 ? styles.reverseTrack : ""}`}
            key={rowIndex}
            style={
              {
                "--feed-duration": `${Math.max(52, loopSegment.length * 7)}s`,
                "--row-offset": `${rowIndex * -72}px`,
              } as CSSProperties
            }
          >
            {[0, 1].map((groupIndex) => (
              <div className={styles.feedGroup} key={groupIndex}>
                {loopSegment.map((pin, index) => (
                  <div
                    className={styles.pinWrap}
                    key={`${pin.id}-${rowIndex}-${groupIndex}-${index}`}
                    style={
                      {
                        "--pin-lift": `${((index + rowIndex) % 3) * 8}px`,
                        "--pin-width": `calc(var(--card-width) * ${0.9 + ((index + rowIndex) % 4) * 0.05
                          })`,
                      } as CSSProperties
                    }
                  >
                    <PinCard pin={pin} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
