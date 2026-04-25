import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Navigate } from "react-router-dom"
import styles from "./ProfilePage.module.css"
import { ProfileHeader } from "@/widgets/profile-header/ProfileHeader"
import { ProfileContent } from "@/widgets/profile-content/ProfileContent"
import { ProfileContactInfo, type ContactInfoValues } from "@/widgets/profile-contact-info/ProfileContactInfo"
import { fetchCurrentUser, updateCurrentUserNickname } from "./profile.api"
import type { ProfileUserResponse } from "./profile.api"
import { useAuth } from "@/app/providers/AuthProvider"

type User = {
  id: string
  loginName: string
  nickname: string
  fullName: string
}

const CURRENT_USER_QUERY_KEY = ["current-user"]

function mapProfileUser(user: ProfileUserResponse): User {
  const nickname = user.nickname ?? ""
  const fullName = [user.firstName, user.secondName].filter(Boolean).join(" ")

  return {
    id: user.id,
    loginName: user.loginName,
    nickname,
    fullName,
  }
}

export const ProfilePage = () => {
  const { isAuth } = useAuth()
  const queryClient = useQueryClient()
  const [activeSection, setActiveSection] = useState<"content" | "contact-info">("content")
  const {
    data: profileResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    enabled: isAuth === true,
  })

  const updateNicknameMutation = useMutation({
    mutationFn: updateCurrentUserNickname,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updatedUser)
    },
  })

  const user = profileResponse ? mapProfileUser(profileResponse) : null
  const [contactInfo, setContactInfo] = useState<ContactInfoValues>({
    email: "",
    phoneNumber: "",
    login: "",
  })

  const handleUpdateNickname = async (nickname: string) => {
    if (!user) return

    await updateNicknameMutation.mutateAsync(nickname)
  }

  const handleOpenContactInfo = () => {
    if (user) {
      setContactInfo((current) =>
        current.login || current.email || current.phoneNumber
          ? current
          : {
              email: `${user.loginName}@example.com`,
              phoneNumber: "",
              login: user.loginName,
            },
      )
    }

    setActiveSection("contact-info")
  }

  const handleCloseContactInfo = () => {
    setActiveSection("content")
  }

  const handleSaveContactInfo = (values: ContactInfoValues) => {
    setContactInfo(values)
    setActiveSection("content")
  }

  if (isAuth === null) {
    return <div className={styles.loading}>Loading...</div>
  }

  if (isAuth === false) {
    return <Navigate to="/" replace />
  }

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>
  }

  if (!user || isError) {
    return <div className={styles.loading}>Profile API data is unavailable</div>
  }

  return (
    <div className={styles.page}>
      <ProfileHeader
        user={user}
        onUpdateNickname={handleUpdateNickname}
        onOpenContactInfo={handleOpenContactInfo}
        isSecondaryView={activeSection !== "content"}
        onBackToProfile={handleCloseContactInfo}
      />
      {activeSection === "contact-info" ? (
        <ProfileContactInfo
          initialValues={contactInfo}
          onCancel={handleCloseContactInfo}
          onSave={handleSaveContactInfo}
        />
      ) : (
        <ProfileContent />
      )}
    </div>
  )
}
