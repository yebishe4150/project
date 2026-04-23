import { useState } from "react"
import { generateImage } from "@/features/upload-image/api/generateImage"
import { uploadImage } from "@/features/upload-image/api/uploadImage"
import type { UploadImageData } from "@/features/upload-image/model/uploadImage.types"
import { ProfileEmptyState } from "./ui/ProfileEmptyState"
import { ProfileTabs } from "./ui/ProfileTabs"
import type { ProfileImage } from "./profileContent.api"
import styles from "./ProfileContent.module.css"

export const ProfileContent = () => {
  const [activeTab, setActiveTab] = useState<"photos" | "ai">("photos")
  const [images, setImages] = useState<ProfileImage[]>([])

  const handleUpload = async (data: UploadImageData) => {
    const uploadedImage = await uploadImage(data)

    setImages((currentImages) => [
      {
        id: uploadedImage.url,
        url: uploadedImage.url,
        description: data.description || null,
        createTime: new Date().toISOString(),
      },
      ...currentImages,
    ])
  }

  const handleGenerate = async () => {
    const prompt = window.prompt("Describe the image you want to generate")

    if (!prompt) return

    const generatedImage = await generateImage({ prompt })

    setImages((currentImages) => [
      {
        id: generatedImage.imageUrl,
        url: generatedImage.imageUrl,
        description: prompt,
        createTime: new Date().toISOString(),
      },
      ...currentImages,
    ])
  }

  return (
    <section className={styles.content}>
      <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />

      {images.length === 0 ? (
        <ProfileEmptyState onUpload={handleUpload} onGenerate={handleGenerate} />
      ) : (
        <div className={styles.grid}>
          {images.map((image) => (
            <img className={styles.image} key={image.id} src={image.url} alt="" />
          ))}
        </div>
      )}
    </section>
  )
}
