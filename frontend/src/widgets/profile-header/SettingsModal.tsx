import { useEffect, useRef } from "react"
import { Moon, Sun, X } from "lucide-react"
import { useTheme } from "@/app/providers/useTheme"
import styles from "./SettingsModal.module.css"

type Props = {
    onClose: () => void
}

export const SettingsModal = ({ onClose }: Props) => {
    const { theme, setTheme } = useTheme()
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
                        Settings
                    </h2>

                    <button
                        ref={closeButtonRef}
                        className={styles.closeButton}
                        type="button"
                        aria-label="Close settings"
                        onClick={onClose}
                    >
                        <X aria-hidden="true" />
                    </button>
                </div>

                <div className={styles.content}>
                    <section className={styles.settingSection} aria-labelledby="appearance-title">
                        <div className={styles.settingText}>
                            <h3 className={styles.settingTitle} id="appearance-title">
                                Choose Theme
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
                                aria-label={`Switch to ${isDarkTheme ? "light" : "dark"} theme`}
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
                            {isDarkTheme ? "Dark theme" : "Light theme"}
                        </p>
                    </section>

                    <section className={styles.settingSection} aria-labelledby="language-title">
                        <div className={styles.settingText}>
                            <h3 className={styles.settingTitle} id="language-title">
                                Language
                            </h3>
                        </div>

                        <select
                            className={styles.languageSelect}
                            aria-label="Application language"
                            value="en"
                            disabled
                        >
                            <option value="en">English</option>
                            <option value="ru">Русский</option>
                        </select>
                    </section>
                </div>
            </section>
        </div>
    )
}