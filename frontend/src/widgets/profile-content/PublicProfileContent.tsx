import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"
import { ImageCard } from "@/entities/image-card/ImageCard"
import { getApiErrorMessage, logApiError } from "@/shared/api/errors/errorMapper"
import { ProfileTabs } from "./ui/ProfileTabs"
import {
    fetchPublicProfileImages,
    type ProfileImage,
    type ProfileImageTab,
} from "./profileContent.api"
import styles from "./ProfileContent.module.css"

const PUBLIC_PROFILE_IMAGES_QUERY_KEY = ["public-profile-images"]

type Props = {
    nickName: string
}

export const PublicProfileContent = ({ nickName }: Props) => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [activeTab, setActiveTab] = useState<ProfileImageTab>(
        searchParams.get("tab") === "ai" ? "ai" : "photos",
    )
    const queryClient = useQueryClient()

    const { data: images = [], isLoading, isError, error } = useQuery({
        queryKey: [...PUBLIC_PROFILE_IMAGES_QUERY_KEY, nickName, activeTab],
        queryFn: () => fetchPublicProfileImages(nickName, activeTab),
    })

    const updateImageLike = (imageId: string, liked: boolean, likesCount: number) => {
        queryClient.setQueriesData<ProfileImage[]>({ queryKey: PUBLIC_PROFILE_IMAGES_QUERY_KEY }, (current) =>
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
    useEffect(() => {
        if (isError) {
            logApiError("Could not load public profile images", error)
        }
    }, [error, isError])

    return (
        <section className={styles.content}>
            <ProfileTabs activeTab={activeTab} onChange={changeTab} />

            {isLoading ? (
                <div className={styles.status}>Loading images...</div>
            ) : isError ? (
                <div className={styles.status}>{getApiErrorMessage(error, "Could not load images. Please try again.")}</div>
            ) : images.length === 0 ? (
                <div className={styles.status}>No public images yet.</div>
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
