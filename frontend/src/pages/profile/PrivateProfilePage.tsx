import { useEffect, useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/app/providers/useAuth"
import { ProfileHeader } from "@/widgets/profile-header/ProfileHeader"
import { PrivateProfileContent } from "@/widgets/profile-content/PrivateProfileContent"
import { ProfileContactInfo, type ContactInfoValues } from "@/widgets/profile-contact-info/ProfileContactInfo"
import { changePassword } from "@/features/auth/auth"
import type { ApiError } from "@/shared/api/errors/errorTypes"
import { isApiError } from "@/shared/api/errors/typeGuard"
import { fetchCurrentUser, updateCurrentUserNickname, updateCurrentUserProfile } from "./profile.api"
import type { ProfileUserResponse } from "./profile.api"
import styles from "./ProfilePage.module.css"

type HeaderUser = {
  nickname: string
}

const CURRENT_USER_QUERY_KEY = ["current-user"]
const CURRENT_PROFILE_FALLBACK_SLUG = "current"
const PROFILE_SYNC_ERROR_IMAGE_SRC = "/profile-sync-error-background.jpg"

function isNotFoundError(error: unknown): error is ApiError {
  return isApiError(error) && error.status === 404
}

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
  const [isProfileSyncErrorBannerOpen, setIsProfileSyncErrorBannerOpen] = useState(false)

  const {
    data: profileResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    enabled: isAuth === true,
    retry: (failureCount, queryError) => !isNotFoundError(queryError) && failureCount < 2,
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

  const isProfileSyncError = isNotFoundError(error)
  const headerUser = profileResponse ? mapHeaderUser(profileResponse) : isProfileSyncError ? { nickname: "" } : null
  const currentUserSlug = profileResponse?.nickname || profileResponse?.loginName
  const normalizedRouteNickname = routeNickname?.toLowerCase()
  const normalizedCurrentUserSlug = currentUserSlug?.toLowerCase()
  const isFallbackProfileRoute = normalizedRouteNickname === CURRENT_PROFILE_FALLBACK_SLUG
  const pendingNicknameSlug = pendingNicknameUser?.nickname || pendingNicknameUser?.loginName
  const normalizedPendingNicknameSlug = pendingNicknameSlug?.toLowerCase()

  useEffect(() => {
    if (
      pendingNicknameUser &&
      normalizedRouteNickname &&
      normalizedPendingNicknameSlug === normalizedRouteNickname
    ) {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, pendingNicknameUser)
      const timeoutId = window.setTimeout(() => setPendingNicknameUser(null), 0)

      return () => {
        window.clearTimeout(timeoutId)
      }
    }
  }, [
    normalizedPendingNicknameSlug,
    normalizedRouteNickname,
    pendingNicknameUser,
    queryClient,
  ])

  useEffect(() => {
    if (!isProfileSyncError) {
      return
    }

    console.warn("Current user profile is not available yet.", {
      status: error.status,
      message: error.message,
      routeNickname,
      reason: "Auth user exists, but user-service profile returned 404.",
    })
  }, [error, isProfileSyncError, routeNickname])

  useEffect(() => {
    if (!isProfileSyncError) {
      const timeoutId = window.setTimeout(() => setIsProfileSyncErrorBannerOpen(false), 0)

      return () => {
        window.clearTimeout(timeoutId)
      }
    }
  }, [isProfileSyncError])

  const handleUpdateNickname = async (nickname: string) => {
    if (isProfileSyncError) {
      setIsProfileSyncErrorBannerOpen(true)
      return
    }

    if (!profileResponse) {
      return
    }

    try {
      await updateNicknameMutation.mutateAsync(nickname)
    } catch (mutationError) {
      if (isNotFoundError(mutationError)) {
        setIsProfileSyncErrorBannerOpen(true)
        return
      }

      throw mutationError
    }
  }

  const handleOpenContactInfo = () => {
    if (isProfileSyncError || !profileResponse) {
      setIsProfileSyncErrorBannerOpen(true)
      return
    }

    if (profileResponse) {
      setContactInfo(mapContactInfo(profileResponse))
    }

    setActiveSection("contact-info")
  }

  const handleCloseContactInfo = () => {
    setActiveSection("content")
  }

  const handleSaveContactInfo = async (values: ContactInfoValues) => {
    try {
      await updateProfileMutation.mutateAsync({
        email: values.email,
        phoneNumber: values.phoneNumber,
        firstName: values.firstName,
        secondName: values.secondName,
      })
    } catch (mutationError) {
      if (isNotFoundError(mutationError)) {
        setIsProfileSyncErrorBannerOpen(true)
        return
      }

      throw mutationError
    }

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

  if (isProfileSyncErrorBannerOpen) {
    return (
      <div className={styles.profileError}>
        <div className={styles.profileErrorFrame}>
          <img
            className={styles.profileErrorImage}
            src={PROFILE_SYNC_ERROR_IMAGE_SRC}
            alt="Profile data is unavailable"
            onError={(event) => {
              event.currentTarget.style.display = "none"
            }}
          />
          <button
            className={styles.profileErrorButton}
            type="button"
            onClick={() => {
              setIsProfileSyncErrorBannerOpen(false)
            }}
          >
            Back to Profile
          </button>
        </div>
      </div>
    )
  }

  if (!headerUser || (isError && !isProfileSyncError)) {
    return <div className={styles.loading}>Profile API data is unavailable</div>
  }

  if (pendingNicknameUser) {
    return <div className={styles.loading}>Loading...</div>
  }

  if (isFallbackProfileRoute && currentUserSlug) {
    return <Navigate to={`/profile/${encodeURIComponent(currentUserSlug)}/me`} replace />
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
