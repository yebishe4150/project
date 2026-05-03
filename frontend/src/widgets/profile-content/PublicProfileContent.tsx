import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ProfileTabs } from "./ui/ProfileTabs"
import {
    fetchPublicProfileImages,
    type ProfileImageTab,
} from "./profileContent.api"
import styles from "./ProfileContent.module.css"

const PUBLIC_PROFILE_IMAGES_QUERY_KEY = ["public-profile-images"]

type Props = {
    nickName: string
}

export const PublicProfileContent = ({ nickName }: Props) => {
    const [activeTab, setActiveTab] = useState<ProfileImageTab>("photos")

    const { data: images = [], isLoading } = useQuery({
        queryKey: [...PUBLIC_PROFILE_IMAGES_QUERY_KEY, nickName, activeTab],
        queryFn: () => fetchPublicProfileImages(nickName, activeTab),
    })

    return (
        <section className={styles.content}>
            <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />

            {isLoading ? (
                <div className={styles.status}>Loading images...</div>
            ) : images.length === 0 ? (
                <div className={styles.status}>No public images yet.</div>
            ) : (
                <div className={styles.grid}>
                    {images.map((image) => (
                        <img
                            className={styles.image}
                            key={image.id}
                            src={image.url}
                            alt={image.description ?? ""}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}