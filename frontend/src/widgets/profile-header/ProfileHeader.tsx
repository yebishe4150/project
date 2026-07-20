import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, CircleUserRound, Ellipsis, Home, Image, LogOut, Search, Settings, Share2 } from "lucide-react"
import { useAuth } from "@/app/providers/useAuth"
import { getApiErrorMessage, logApiError } from "@/shared/api/errors/errorMapper"
import { SettingsModal } from "./SettingsModal"
import styles from "./ProfileHeader.module.css"
import { useTranslation } from "react-i18next"

type HeaderUser = {
  nickname: string
}

type Props = {
  user: HeaderUser
  profileMode?: "private" | "public"
  onUpdateNickname?: (nickname: string) => Promise<void>
  onOpenContactInfo?: () => void
  isSecondaryView?: boolean
  onBackToProfile?: () => void
}

const copyText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textArea = document.createElement("textarea")
  textArea.value = text
  textArea.setAttribute("readonly", "")
  textArea.style.position = "fixed"
  textArea.style.left = "-9999px"
  document.body.appendChild(textArea)
  textArea.select()
  document.execCommand("copy")
  document.body.removeChild(textArea)
}

export const ProfileHeader = ({
  user,
  profileMode = "private",
  onUpdateNickname,
  onOpenContactInfo,
  isSecondaryView = false,
  onBackToProfile,
}: Props) => {
  const { t } = useTranslation(["profile", "common", "errors"])
  const isPrivate = profileMode === "private"
  const { logout } = useAuth()
  const navigate = useNavigate()
  const displayNickname = user.nickname
  const avatarLetter = displayNickname.slice(0, 1).toUpperCase() || "?"
  const [isEditingNickname, setIsEditingNickname] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isActionsOpen, setIsActionsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isLinkCopied, setIsLinkCopied] = useState(false)
  const [isShareTooltipHidden, setIsShareTooltipHidden] = useState(false)
  const [nickname, setNickname] = useState(displayNickname)
  const [nicknameError, setNicknameError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const actionsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setNickname(displayNickname)
      setNicknameError(null)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [displayNickname])

  useEffect(() => {
    if (!isLinkCopied) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setIsLinkCopied(false)
      setIsShareTooltipHidden(true)
    }, 1000)

    return () => window.clearTimeout(timeoutId)
  }, [isLinkCopied])

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isMenuOpen])

  useEffect(() => {
    if (!isActionsOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!actionsRef.current?.contains(event.target as Node)) {
        setIsActionsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsActionsOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isActionsOpen])

  const handleSaveNickname = async () => {
    const nextNickname = nickname.trim()

    if (!nextNickname || nextNickname === displayNickname) {
      setNickname(displayNickname)
      setIsEditingNickname(false)
      return
    }

    try {
      setNicknameError(null)
      await onUpdateNickname?.(nextNickname)
      setIsEditingNickname(false)
    } catch (error) {
      logApiError("Could not update nickname", error, "warn")
      setNicknameError(getApiErrorMessage(error, t("errors:profile.nicknameUpdateFailed")))
    }
  }

  const handleCancelNickname = () => {
    setNickname(displayNickname)
    setNicknameError(null)
    setIsEditingNickname(false)
  }

  const handleLogout = async () => {
    setIsMenuOpen(false)
    await logout()
    navigate("/", { replace: true })
  }

  const handleShareProfile = async () => {
    const publicPath = `/profile/${encodeURIComponent(displayNickname)}`
    const publicUrl = new URL(publicPath, window.location.origin).toString()

    await copyText(publicUrl)
    setIsLinkCopied(true)
    setIsShareTooltipHidden(false)
  }

  const handleSharePointerEnter = () => {
    if (!isLinkCopied) {
      setIsShareTooltipHidden(false)
    }
  }

  return (
    <>
      <div className={styles.header}>
        <div className={styles.navWrap} ref={actionsRef}>
          <button
            className={styles.actionsButton}
            type="button"
            aria-label={t("profile:header.actions")}
            aria-expanded={isActionsOpen}
            aria-haspopup="menu"
            onClick={(event) => {
              setIsActionsOpen((current) => !current)
              event.currentTarget.blur()
            }}
          >
            <Ellipsis aria-hidden="true" />
          </button>
          <span className={styles.actionTooltip}>{t("profile:header.actions")}</span>

          {isActionsOpen && (
            <div className={styles.actionsMenu} role="menu" aria-label={t("profile:header.profileActions")}>
              <div className={styles.navItemWrap}>
                <button
                  className={styles.navButton}
                  type="button"
                  role="menuitem"
                  aria-label={t("profile:header.backToFeed")}
                  onClick={() => navigate("/")}
                >
                  <Home aria-hidden="true" />
                </button>
                <span className={styles.actionTooltip}>{t("profile:header.backToFeed")}</span>
              </div>
              <button
                className={styles.navButton}
                type="button"
                role="menuitem"
                aria-label={t("profile:header.openGallery")}
                onClick={() => navigate("/gallery")}
              >
                <Image aria-hidden="true" />
              </button>
              <button
                className={styles.navButton}
                type="button"
                role="menuitem"
                aria-label={t("profile:header.searchComingSoon")}
                title={t("profile:header.searchComingSoon")}
                disabled
              >
                <Search aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {isPrivate && (
          <div className={styles.menuWrap} ref={menuRef}>
            {isSecondaryView && onBackToProfile && (
              <button
                className={styles.backButton}
                type="button"
                aria-label={t("profile:header.backToProfile")}
                onClick={onBackToProfile}
              >
                <ArrowLeft aria-hidden="true" />
              </button>
            )}

            <div className={styles.shareWrap}>
              <button
                className={styles.shareButton}
                type="button"
                aria-label={t("profile:header.shareProfileLink")}
                onPointerEnter={handleSharePointerEnter}
                onFocus={handleSharePointerEnter}
                onClick={handleShareProfile}
                disabled={!displayNickname}
              >
                <Share2 aria-hidden="true" />
              </button>
              <span
                className={`${styles.shareTooltip} ${isLinkCopied ? styles.shareTooltipVisible : ""} ${isShareTooltipHidden ? styles.shareTooltipHidden : ""
                  }`}
                role="status"
              >
                {isLinkCopied ? t("profile:header.linkCopied") : t("profile:header.shareProfileLink")}
              </span>
            </div>

            <button
              className={styles.menu}
              type="button"
              aria-label={t("profile:header.openProfileMenu")}
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              <span />
              <span />
              <span />
            </button>

            {isMenuOpen && (
              <div className={styles.dropdown} role="menu" aria-label={t("profile:header.profileMenu")}>
                <button
                  className={styles.menuItem}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false)
                    onOpenContactInfo?.()
                  }}
                >
                  <span className={styles.menuItemIcon}>
                    <CircleUserRound aria-hidden="true" />
                  </span>
                  <span className={styles.menuLabel}>{t("profile:header.contactInfo")}</span>
                </button>
                <button
                  className={styles.menuItem}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false)
                    setIsSettingsOpen(true)
                  }}
                >
                  <span className={styles.menuItemIcon}>
                    <Settings aria-hidden="true" />
                  </span>
                  <span className={styles.menuLabel}>{t("profile:header.settings")}</span>
                </button>

                <div className={styles.menuDivider} />

                <div className={styles.actionRow}>
                  <button className={styles.secondaryAction} type="button" role="menuitem" onClick={handleLogout}>
                    <span className={styles.actionIcon}>
                      <LogOut aria-hidden="true" />
                    </span>
                    {t("common:actions.logout")}
                  </button>
                  <button className={styles.dangerAction} type="button" role="menuitem">
                    {t("profile:header.deleteAccount")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <div className={styles.avatar}>{avatarLetter}</div>

        {isPrivate && isEditingNickname ? (
          <div className={styles.nicknameEdit}>
            <input
              autoFocus
              className={styles.nicknameInput}
              value={nickname}
              placeholder={t("profile:header.addNickname")}
              onBlur={handleSaveNickname}
              onChange={(event) => {
                setNicknameError(null)
                setNickname(event.target.value)
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur()
                }

                if (event.key === "Escape") {
                  handleCancelNickname()
                }
              }}
            />
            {nicknameError && (
              <span className={styles.nicknameError}>{nicknameError}</span>
            )}
          </div>
        ) : isPrivate ? (
          <button
            className={styles.username}
            type="button"
            onClick={() => {
              setNickname(displayNickname)
              setIsEditingNickname(true)
            }}
          >
            {displayNickname || t("profile:header.addNickname")}
          </button>
        ) : (
          <div className={`${styles.username} ${styles.publicUsername}`}>{displayNickname || t("profile:header.unknownUser")}</div>
        )}

      </div>
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </>
  )
}
