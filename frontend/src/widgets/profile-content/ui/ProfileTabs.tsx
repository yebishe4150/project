import styles from "./ProfileTabs.module.css"

type Props = {
  activeTab: "photos" | "ai"
  onChange: (tab: "photos" | "ai") => void
}

export const ProfileTabs = ({ activeTab, onChange }: Props) => {
  return (
    <div className={styles.tabs}>
      <button
        className={activeTab === "photos" ? styles.active : ""}
        onClick={() => onChange("photos")}
      >
        My Photos
      </button>

      <button
        className={activeTab === "ai" ? styles.active : ""}
        onClick={() => onChange("ai")}
      >
        AI Generated
      </button>
    </div>
  )
}