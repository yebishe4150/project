import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, CircleUserRound, LogOut, Settings } from "lucide-react"
import { useAuth } from "@/app/providers/AuthProvider"
import styles from "./ProfileHeader.module.css"

type User = {
  loginName: string
  nickname: string
  fullName: string
}

type Props = {
  user: User
  onUpdateNickname: (nickname: string) => Promise<void>
  onOpenContactInfo: () => void
  isSecondaryView?: boolean
  onBackToProfile?: () => void
}

export const ProfileHeader = ({
  user,
  onUpdateNickname,
  onOpenContactInfo,
  isSecondaryView = false,
  onBackToProfile,
}: Props) => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const displayNickname = user.nickname
  const avatarLetter = displayNickname.slice(0, 1).toUpperCase() || "?"
  const [isEditingNickname, setIsEditingNickname] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [nickname, setNickname] = useState(displayNickname)
  const menuRef = useRef<HTMLDivElement | null>(null)

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

  const handleSaveNickname = async () => {
    const nextNickname = nickname.trim()

    if (!nextNickname || nextNickname === displayNickname) {
      setNickname(displayNickname)
      setIsEditingNickname(false)
      return
    }

    await onUpdateNickname(nextNickname)
    setIsEditingNickname(false)
  }

  const handleCancelNickname = () => {
    setNickname(displayNickname)
    setIsEditingNickname(false)
  }

  const handleLogout = async () => {
    setIsMenuOpen(false)
    await logout()
    navigate("/", { replace: true })
  }

  return (
    <div className={styles.header}>
      <div className={styles.menuWrap} ref={menuRef}>
        {isSecondaryView && onBackToProfile && (
          <button
            className={styles.backButton}
            type="button"
            aria-label="Back to profile"
            onClick={onBackToProfile}
          >
            <ArrowLeft aria-hidden="true" />
          </button>
        )}

        <button
          className={styles.menu}
          type="button"
          aria-label="Open profile menu"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        {isMenuOpen && (
          <div className={styles.dropdown} role="menu" aria-label="Profile menu">
            <button
              className={styles.menuItem}
              type="button"
              role="menuitem"
              onClick={() => {
                setIsMenuOpen(false)
                onOpenContactInfo()
              }}
            >
              <span className={styles.menuItemIcon}>
                <CircleUserRound aria-hidden="true" />
              </span>
              <span className={styles.menuLabel}>Contact info</span>
            </button>
            <button className={styles.menuItem} type="button" role="menuitem">
              <span className={styles.menuItemIcon}>
                <Settings aria-hidden="true" />
              </span>
              <span className={styles.menuLabel}>Settings</span>
            </button>

            <div className={styles.menuDivider} />

            <div className={styles.actionRow}>
              <button className={styles.secondaryAction} type="button" role="menuitem" onClick={handleLogout}>
                <span className={styles.actionIcon}>
                  <LogOut aria-hidden="true" />
                </span>
                Log out
              </button>
              <button className={styles.dangerAction} type="button" role="menuitem">
                Delete account
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.avatar}>{avatarLetter}</div>

      {isEditingNickname ? (
        <input
          autoFocus
          className={styles.nicknameInput}
          value={nickname}
          placeholder="Add nickname"
          onBlur={handleSaveNickname}
          onChange={(event) => setNickname(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur()
            }

            if (event.key === "Escape") {
              handleCancelNickname()
            }
          }}
        />
      ) : (
        <button
          className={styles.username}
          type="button"
          onClick={() => {
            setNickname(displayNickname)
            setIsEditingNickname(true)
          }}
        >
          {displayNickname || "Add nickname"}
        </button>
      )}

      <div className={styles.fullname}>{user.fullName || "Add your full name"}</div>
    </div>
  )
}
