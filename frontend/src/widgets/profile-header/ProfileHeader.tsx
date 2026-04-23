import { useState } from "react"
import styles from "./ProfileHeader.module.css"

type User = {
  loginName: string
  nickname: string
  fullName: string
}

type Props = {
  user: User
  onUpdateNickname: (nickname: string) => Promise<void>
}

export const ProfileHeader = ({ user, onUpdateNickname }: Props) => {
  const displayNickname = user.nickname
  const avatarLetter = displayNickname.slice(0, 1).toUpperCase() || "?"
  const [isEditingNickname, setIsEditingNickname] = useState(false)
  const [nickname, setNickname] = useState(displayNickname)

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

  return (
    <div className={styles.header}>
      <button className={styles.menu} type="button" aria-label="Open profile menu">
        <span />
        <span />
        <span />
      </button>

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
