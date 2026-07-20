import styles from "./Footer.module.css"
import { useTranslation } from "react-i18next"

export const Footer = () => {
  const { t } = useTranslation("common")
  return (
    <footer className={styles.footer}>
      {t("brand.copyright")}
    </footer>
  )
}
