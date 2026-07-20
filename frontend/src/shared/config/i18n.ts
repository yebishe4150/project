import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import enAuth from "@/locales/en/auth.json"
import enCommon from "@/locales/en/common.json"
import enErrors from "@/locales/en/errors.json"
import enFeed from "@/locales/en/feed.json"
import enGallery from "@/locales/en/gallery.json"
import enMedia from "@/locales/en/media.json"
import enNotifications from "@/locales/en/notifications.json"
import enProfile from "@/locales/en/profile.json"
import ruAuth from "@/locales/ru/auth.json"
import ruCommon from "@/locales/ru/common.json"
import ruErrors from "@/locales/ru/errors.json"
import ruFeed from "@/locales/ru/feed.json"
import ruGallery from "@/locales/ru/gallery.json"
import ruMedia from "@/locales/ru/media.json"
import ruNotifications from "@/locales/ru/notifications.json"
import ruProfile from "@/locales/ru/profile.json"

const resources = {
  en: { auth: enAuth, common: enCommon, errors: enErrors, feed: enFeed, gallery: enGallery, media: enMedia, notifications: enNotifications, profile: enProfile },
  ru: { auth: ruAuth, common: ruCommon, errors: ruErrors, feed: ruFeed, gallery: ruGallery, media: ruMedia, notifications: ruNotifications, profile: ruProfile },
}

type AppLanguage = "en" | "ru"

const parseSupportedLanguage = (language?: string | null): AppLanguage | null => {
  const normalizedLanguage = language?.trim().toLowerCase()

  if (normalizedLanguage?.startsWith("en")) {
    return "en"
  }

  if (normalizedLanguage?.startsWith("ru")) {
    return "ru"
  }

  return null
}

const getInitialLanguage = (): AppLanguage => {
  const savedLanguage = parseSupportedLanguage(window.localStorage.getItem("language"))

  if (savedLanguage) {
    return savedLanguage
  }

  return parseSupportedLanguage(window.navigator.language) ?? "ru"
}

const normalizeLanguage = (language?: string) => parseSupportedLanguage(language) ?? "ru"

i18n.on("languageChanged", (language) => {
  document.documentElement.lang = normalizeLanguage(language)
})

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: "ru",
    supportedLngs: ["en", "ru"],
    load: "languageOnly",
    defaultNS: "common",
    interpolation: { escapeValue: false },
  })

export default i18n
