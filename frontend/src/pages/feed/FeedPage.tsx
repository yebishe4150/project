import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { FeedList } from "@/features/feed/FeedList"
import { fetchPins } from "@/entities/pin/pin.api.ts"
import { getApiErrorMessage, logApiError } from "@/shared/api/errors/errorMapper"
import styles from "./FeedPage.module.css"
import { useTranslation } from "react-i18next"


export const FeedPage = () => {
  const { t } = useTranslation("feed")
  const { data: pins = [], isError, error } = useQuery({
    queryKey: ["feed", "pins"],
    queryFn: fetchPins,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (isError) {
      logApiError("Could not load public feed", error)
    }
  }, [error, isError])

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.badge}>{t("hero.badge")}</div>
          <h1 className={styles.title}>{t("hero.title")}</h1>
          <p className={styles.text}>
            {t("hero.description")}
          </p>
        </div>
      </section>

      <section className={styles.container}>
        {isError ? (
          <div className={styles.error}>{getApiErrorMessage(error, t("unavailable"))}</div>
        ) : (
          <FeedList pins={pins} />
        )}
      </section>
    </div>
  )
}
