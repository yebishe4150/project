import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { generateImage } from "@/features/upload-image/api/generateImage"
import { uploadImage } from "@/features/upload-image/api/uploadImage"
import type { UploadImageData } from "@/features/upload-image/model/uploadImage.types"
import { ProfileEmptyState } from "./ui/ProfileEmptyState"
import { ProfileAddMenu } from "./ui/ProfileAddMenu"
import { ProfileTabs } from "./ui/ProfileTabs"
import {
  fetchProfileImages,
  type ProfileImageTab,
} from "./profileContent.api"
import styles from "./ProfileContent.module.css"

const PROFILE_IMAGES_QUERY_KEY = ["profile-images"]

export const ProfileContent = () => {
  const [activeTab, setActiveTab] = useState<ProfileImageTab>("photos")
  const queryClient = useQueryClient()
  const { data: images = [], isLoading } = useQuery({
    queryKey: [...PROFILE_IMAGES_QUERY_KEY, activeTab],
    queryFn: () => fetchProfileImages(activeTab),
  })

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

  return (
    <section className={styles.content}>
      <ProfileTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        centerSlot={
          images.length > 0 ? (
            <ProfileAddMenu onUpload={handleUpload} onGenerate={handleGenerate} />
          ) : undefined
        }
      />

      {isLoading ? (
        <div className={styles.status}>Loading images...</div>
      ) : images.length === 0 ? (
        <ProfileEmptyState onUpload={handleUpload} onGenerate={handleGenerate} />
      ) : (
        <div className={styles.grid}>
          {images.map((image) => (
            <img className={styles.image} key={image.id} src={image.url} alt={image.description ?? ""} />
          ))}
        </div>
      )}
    </section>
  )
}
