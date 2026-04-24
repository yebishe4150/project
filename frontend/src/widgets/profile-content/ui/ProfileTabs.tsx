import styles from "./ProfileTabs.module.css"

type Props = {
  activeTab: "photos" | "ai"
  onChange: (tab: "photos" | "ai") => void
  centerSlot?: React.ReactNode
}

export const ProfileTabs = ({ activeTab, onChange, centerSlot }: Props) => {
  return (
    <div className={styles.tabs}>
      <button
        className={`${styles.tabButton} ${activeTab === "photos" ? styles.active : ""}`}
        onClick={() => onChange("photos")}
      >
        My Photos
      </button>

      {centerSlot && <div className={styles.centerSlot}>{centerSlot}</div>}

      <button
        className={`${styles.tabButton} ${activeTab === "ai" ? styles.active : ""}`}
        onClick={() => onChange("ai")}
      >
        AI Generated
      </button>
    </div>
  )
}
