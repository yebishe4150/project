import { useEffect, useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/app/providers/AuthProvider"
import { ProfileHeader } from "@/widgets/profile-header/ProfileHeader"
import { PrivateProfileContent } from "@/widgets/profile-content/PrivateProfileContent"
import { ProfileContactInfo, type ContactInfoValues } from "@/widgets/profile-contact-info/ProfileContactInfo"
import { changePassword } from "@/features/auth/auth"
import { fetchCurrentUser, updateCurrentUserNickname, updateCurrentUserProfile } from "./profile.api"
import type { ProfileUserResponse } from "./profile.api"
import styles from "./ProfilePage.module.css"

type HeaderUser = {
  nickname: string
}

const CURRENT_USER_QUERY_KEY = ["current-user"]

function mapHeaderUser(user: ProfileUserResponse): HeaderUser {
  return {
    nickname: user.nickname ?? "",
  }
}

function mapContactInfo(user: ProfileUserResponse): ContactInfoValues {
  return {
    email: user.email ?? "",
    phoneNumber: user.phoneNumber ?? "",
    login: user.loginName ?? "",
    firstName: user.firstName ?? "",
    secondName: user.secondName ?? "",
    currentPassword: "",
    newPassword: "",
  }
}

export const PrivateProfilePage = () => {
  const { isAuth } = useAuth()
  const { nickname: routeNickname } = useParams<{ nickname: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeSection, setActiveSection] = useState<"content" | "contact-info">("content")
  const [contactInfo, setContactInfo] = useState<ContactInfoValues>({
    email: "",
    phoneNumber: "",
    login: "",
    firstName: "",
    secondName: "",
    currentPassword: "",
    newPassword: "",
  })
  const [pendingNicknameUser, setPendingNicknameUser] = useState<ProfileUserResponse | null>(null)

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
      const nextSlug = updatedUser.nickname || updatedUser.loginName

      if (nextSlug) {
        setPendingNicknameUser(updatedUser)
        navigate(`/profile/${encodeURIComponent(nextSlug)}/me`, { replace: true })
        return
      }

      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updatedUser)
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: updateCurrentUserProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updatedUser)
      setContactInfo(mapContactInfo(updatedUser))
    },
  })

  const headerUser = profileResponse ? mapHeaderUser(profileResponse) : null
  const currentUserSlug = profileResponse?.nickname || profileResponse?.loginName
  const normalizedRouteNickname = routeNickname?.toLowerCase()
  const normalizedCurrentUserSlug = currentUserSlug?.toLowerCase()
  const pendingNicknameSlug = pendingNicknameUser?.nickname || pendingNicknameUser?.loginName
  const normalizedPendingNicknameSlug = pendingNicknameSlug?.toLowerCase()

  useEffect(() => {
    if (
      pendingNicknameUser &&
      normalizedRouteNickname &&
      normalizedPendingNicknameSlug === normalizedRouteNickname
    ) {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, pendingNicknameUser)
      setPendingNicknameUser(null)
    }
  }, [
    normalizedPendingNicknameSlug,
    normalizedRouteNickname,
    pendingNicknameUser,
    queryClient,
  ])

  const handleUpdateNickname = async (nickname: string) => {
    if (!profileResponse) return

    await updateNicknameMutation.mutateAsync(nickname)
  }

  const handleOpenContactInfo = () => {
    if (profileResponse) {
      setContactInfo(mapContactInfo(profileResponse))
    }

    setActiveSection("contact-info")
  }

  const handleCloseContactInfo = () => {
    setActiveSection("content")
  }

  const handleSaveContactInfo = async (values: ContactInfoValues) => {
    await updateProfileMutation.mutateAsync({
      email: values.email,
      phoneNumber: values.phoneNumber,
      firstName: values.firstName,
      secondName: values.secondName,
    })

    setActiveSection("content")
  }

  const handleChangePassword = async ({ currentPassword, newPassword }: Pick<ContactInfoValues, "currentPassword" | "newPassword">) => {
    await changePassword({
      currentPassword,
      newPassword,
    })
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

  if (!headerUser || isError) {
    return <div className={styles.loading}>Profile API data is unavailable</div>
  }

  if (pendingNicknameUser) {
    return <div className={styles.loading}>Loading...</div>
  }

  if (routeNickname && normalizedCurrentUserSlug && normalizedRouteNickname !== normalizedCurrentUserSlug) {
    return <Navigate to={`/profile/${encodeURIComponent(routeNickname)}`} replace />
  }

  return (
    <div className={`${styles.page} ${activeSection === "contact-info" ? styles.scrollPage : ""}`}>
      <ProfileHeader
        user={headerUser}
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
          onChangePassword={handleChangePassword}
          isSaving={updateProfileMutation.isPending}
        />
      ) : (
        <PrivateProfileContent />
      )}
    </div>
  )
}
