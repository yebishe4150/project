import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ProfileHeader } from "@/widgets/profile-header/ProfileHeader"
import { PublicProfileContent } from "@/widgets/profile-content/PublicProfileContent"
import { fetchPublicUser } from "./profile.api"
import styles from "./ProfilePage.module.css"

const PUBLIC_USER_QUERY_KEY = ["public-user"]

export const PublicProfilePage = () => {
  const { nickname } = useParams<{ nickname: string }>()

  const { data, isLoading, isError } = useQuery({
    queryKey: [...PUBLIC_USER_QUERY_KEY, nickname],
    queryFn: () => fetchPublicUser(nickname ?? ""),
    enabled: !!nickname,
  })

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>
  }

  if (!nickname || !data || isError) {
    return <div className={styles.loading}>User not found</div>
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
