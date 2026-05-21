import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ProfileHeader } from "@/widgets/profile-header/ProfileHeader"
import { PublicProfileContent } from "@/widgets/profile-content/PublicProfileContent"
import { getApiErrorMessage, logApiError, normalizeApiError } from "@/shared/api/errors/errorMapper"
import { fetchPublicUser } from "./profile.api"
import styles from "./ProfilePage.module.css"

const PUBLIC_USER_QUERY_KEY = ["public-user"]

export const PublicProfilePage = () => {
  const { nickname } = useParams<{ nickname: string }>()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...PUBLIC_USER_QUERY_KEY, nickname],
    queryFn: () => fetchPublicUser(nickname ?? ""),
    enabled: !!nickname,
  })

  useEffect(() => {
    if (!error) {
      return
    }

    logApiError("Could not load public profile", error)
  }, [error])

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>
  }

  if (!nickname || !data || isError) {
    return (
      <div className={styles.loading}>
        {normalizeApiError(error).status === 404
          ? "User not found"
          : getApiErrorMessage(error, "User profile is unavailable")}
      </div>
    )
  }

  const displayNickname = data.nickname ?? nickname

  return (
    <div className={styles.page}>
      <ProfileHeader
        user={{ nickname: displayNickname }}
        profileMode="public"
        isSecondaryView={false}
      />
      <PublicProfileContent nickName={displayNickname} />
    </div>
  )
}
