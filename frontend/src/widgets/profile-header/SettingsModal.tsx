import { useEffect, useRef } from "react"
import { Moon, Sun, X } from "lucide-react"
import { useTheme } from "@/app/providers/useTheme"
import { useTranslation } from "react-i18next"
import styles from "./SettingsModal.module.css"

type Props = {
    onClose: () => void
}

export const SettingsModal = ({ onClose }: Props) => {
    const { theme, setTheme } = useTheme()
    const { t, i18n } = useTranslation("profile")
    const closeButtonRef = useRef<HTMLButtonElement | null>(null)

    useEffect(() => {
        closeButtonRef.current?.focus()

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose()
            }
        }

        document.addEventListener("keydown", handleKeyDown)

        return () => {
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [onClose])

    const isDarkTheme = theme === "dark"
    const selectedLanguage = i18n.resolvedLanguage === "en" ? "en" : "ru"

    const handleLanguageChange = (language: string) => {
        window.localStorage.setItem("language", language)
        void i18n.changeLanguage(language)
    }

    return (
        <div className={styles.overlay} onMouseDown={onClose}>
            <section
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className={styles.header}>
                    <h2 className={styles.title} id="settings-title">
                        {t("settings.title")}
                    </h2>

                    <button
                        ref={closeButtonRef}
                        className={styles.closeButton}
                        type="button"
                        aria-label={t("settings.close")}
                        onClick={onClose}
                    >
                        <X aria-hidden="true" />
                    </button>
                </div>

                <div className={styles.content}>
                    <section className={styles.settingSection} aria-labelledby="appearance-title">
                        <div className={styles.settingText}>
                            <h3 className={styles.settingTitle} id="appearance-title">
                                {t("settings.chooseTheme")}
                            </h3>
                        </div>

                        <div className={styles.themeControl}>
                            <Sun
                                className={`${styles.themeIcon} ${!isDarkTheme ? styles.themeIconActive : ""}`}
                                aria-hidden="true"
                            />

                            <button
                                className={`${styles.themeToggle} ${isDarkTheme ? styles.themeToggleDark : ""}`}
                                type="button"
                                role="switch"
                                aria-checked={isDarkTheme}
                                aria-label={isDarkTheme ? t("settings.switchToLightTheme") : t("settings.switchToDarkTheme")}
                                onClick={() => setTheme(isDarkTheme ? "light" : "dark")}
                            >
                                <span className={styles.themeThumb} />
                            </button>

                            <Moon
                                className={`${styles.themeIcon} ${isDarkTheme ? styles.themeIconActive : ""}`}
                                aria-hidden="true"
                            />
                        </div>

                        <p className={styles.themeValue}>
                            {isDarkTheme ? t("settings.darkTheme") : t("settings.lightTheme")}
                        </p>
                    </section>

                    <section className={styles.settingSection} aria-labelledby="language-title">
                        <div className={styles.settingText}>
                            <h3 className={styles.settingTitle} id="language-title">
                                {t("settings.language")}
                            </h3>
                        </div>

                        <select
                            className={styles.languageSelect}
                            aria-label={t("settings.applicationLanguage")}
                            value={selectedLanguage}
                            onChange={(event) => handleLanguageChange(event.target.value)}
                        >
                            <option value="en">{t("settings.languages.en")}</option>
                            <option value="ru">{t("settings.languages.ru")}</option>
                        </select>
                    </section>
                </div>
            </section>
        </div>
    )
}
