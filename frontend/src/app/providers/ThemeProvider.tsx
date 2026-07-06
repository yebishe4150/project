import { createContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type Theme = "light" | "dark"

type ThemeContextValue = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const THEME_STORAGE_KEY = "pinpet-theme"

export const ThemeContext = createContext<ThemeContextValue | null>(null)

const getInitialTheme = (): Theme => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

    return savedTheme === "dark" ? "dark" : "light"
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setTheme] = useState<Theme>(getInitialTheme)

    useEffect(() => {
        document.documentElement.dataset.theme = theme
        window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    }, [theme])

    const value = useMemo(
        () => ({
            theme,
            setTheme,
        }),
        [theme],
    )

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
