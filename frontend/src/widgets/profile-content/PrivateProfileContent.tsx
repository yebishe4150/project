import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"
import { ImageCard } from "@/entities/image-card/ImageCard"
import { generateImage } from "@/features/upload-image/api/generateImage"
import { uploadImage } from "@/features/upload-image/api/uploadImage"
import type { UploadImageData } from "@/features/upload-image/model/uploadImage.types"
import { getApiErrorMessage, logApiError } from "@/shared/api/errors/errorMapper"
import { ProfileAddMenu } from "./ui/ProfileAddMenu"
import { ProfileEmptyState } from "./ui/ProfileEmptyState"
import { ProfileTabs } from "./ui/ProfileTabs"
import {
  fetchPrivateProfileImages,
  type ProfileImage,
  type ProfileImageTab,
} from "./profileContent.api"
import styles from "./ProfileContent.module.css"
import { useTranslation } from "react-i18next"

const PROFILE_IMAGES_QUERY_KEY = ["profile-images"]

export const PrivateProfileContent = () => {
  const { t } = useTranslation("profile")
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<ProfileImageTab>(
    searchParams.get("tab") === "ai" ? "ai" : "photos",
  )
  const queryClient = useQueryClient()
  const { data: images = [], isLoading, isError, error } = useQuery({
    queryKey: [...PROFILE_IMAGES_QUERY_KEY, activeTab],
    queryFn: () => fetchPrivateProfileImages(activeTab),
  })

  useEffect(() => {
    if (isError) {
      logApiError("Could not load private profile images", error)
    }
  }, [error, isError])

  const refreshImages = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [...PROFILE_IMAGES_QUERY_KEY, "photos"],
      }),
      queryClient.invalidateQueries({
        queryKey: [...PROFILE_IMAGES_QUERY_KEY, "ai"],
      }),
    ])
  }

  const updateImageLike = (imageId: string, liked: boolean, likesCount: number) => {
    queryClient.setQueriesData<ProfileImage[]>({ queryKey: PROFILE_IMAGES_QUERY_KEY }, (current) =>
      current?.map((image) =>
        image.id === imageId
          ? {
            ...image,
            liked,
            likesCount,
          }
          : image,
      ),
    )
  }

  const handleUpload = async (data: UploadImageData) => {
    await uploadImage(data)
    await refreshImages()
    setActiveTab("photos")
  }

  const handleGenerate = async ({
    prompt,
    description,
    tags,
  }: {
    prompt: string
    description?: string
    tags?: string[]
  }) => {
    await generateImage({ prompt, description, tags })
    await refreshImages()
    setActiveTab("ai")
  }

  const changeTab = (tab: ProfileImageTab) => {
    const nextParams = new URLSearchParams(searchParams)

    if (tab === "ai") {
      nextParams.set("tab", "ai")
    } else {
      nextParams.delete("tab")
    }

    nextParams.delete("photo")
    setSearchParams(nextParams)
    setActiveTab(tab)
  }

  return (
    <section className={styles.content}>
      <ProfileTabs
        activeTab={activeTab}
        onChange={changeTab}
        centerSlot={
          images.length > 0 ? (
            <ProfileAddMenu onUpload={handleUpload} onGenerate={handleGenerate} />
          ) : undefined
        }
      />

      {isLoading ? (
        <div className={styles.status}>{t("content.loadingImages")}</div>
      ) : isError ? (
        <div className={styles.status}>
          {getApiErrorMessage(error, t("content.imagesLoadFailed"))}
        </div>
      ) : images.length === 0 ? (
        <ProfileEmptyState onUpload={handleUpload} onGenerate={handleGenerate} />
      ) : (
        <div className={styles.grid}>
          {images.map((image) => (
            <ImageCard
              image={image}
              imageClassName={styles.image}
              shareParams={{ tab: activeTab === "ai" ? "ai" : null }}
              key={image.id}
              onLikeChange={updateImageLike}
            />
          ))}
        </div>
      )}
    </section>
  )
}
