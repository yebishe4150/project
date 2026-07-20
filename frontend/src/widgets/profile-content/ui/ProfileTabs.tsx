import styles from "./ProfileTabs.module.css"
import { useTranslation } from "react-i18next"

type Props = {
  activeTab: "photos" | "ai"
  onChange: (tab: "photos" | "ai") => void
  centerSlot?: React.ReactNode
}

export const ProfileTabs = ({ activeTab, onChange, centerSlot }: Props) => {
  const { t } = useTranslation("profile")
  return (
    <div className={styles.tabs}>
      <button
        className={`${styles.tabButton} ${activeTab === "photos" ? styles.active : ""}`}
        onClick={() => onChange("photos")}
      >
        {t("tabs.photos")}
      </button>

      {centerSlot && <div className={styles.centerSlot}>{centerSlot}</div>}

      <button
        className={`${styles.tabButton} ${activeTab === "ai" ? styles.active : ""}`}
        onClick={() => onChange("ai")}
      >
        {t("tabs.aiGenerated")}
      </button>
    </div>
  )
}
