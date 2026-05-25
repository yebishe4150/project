import { Image, Search, UserRound, Home } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/app/providers/useAuth"
import { TagSearchBox } from "@/features/tag-search/TagSearchBox"
import { fetchCurrentUser } from "@/pages/profile/profile.api"
import { logApiError } from "@/shared/api/errors/errorMapper"
import styles from "./DesktopSideNav.module.css"

const CURRENT_USER_QUERY_KEY = ["current-user"]
const CURRENT_PROFILE_FALLBACK_SLUG = "current"

export const DesktopSideNav = () => {
  const { isAuth } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchWrapRef = useRef<HTMLDivElement | null>(null)
  const { data: currentUser, error: currentUserError } = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    enabled: isAuth === true,
  })

  const profileSlug = currentUser?.nickname || currentUser?.loginName
  const showProfile = isAuth === true
  const isGalleryRoute = location.pathname === "/gallery"
  const isProfileRoute = /^\/profile\/[^/]+(?:\/me)?$/.test(location.pathname)

  useEffect(() => {
    if (currentUserError) {
      logApiError("Could not load current user for desktop navigation", currentUserError)
    }
  }, [currentUserError])

  useEffect(() => {
    if (!isSearchOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!searchWrapRef.current?.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [isSearchOpen])

  const openMyProfile = () => {
    navigate(`/profile/${encodeURIComponent(profileSlug ?? CURRENT_PROFILE_FALLBACK_SLUG)}/me`)
  }

  return (
    <aside className={styles.sideNav} aria-label="Desktop navigation">
      <div className={styles.navList}>
        <button
          className={styles.navItem}
          type="button"
          onClick={() => navigate("/")}
        >
          <Home aria-hidden="true" />
          <span>Feed</span>
        </button>

        {!isGalleryRoute && (
          <>
            <div ref={searchWrapRef} className={`${styles.searchWrap} ${isSearchOpen ? styles.searchWrapOpen : ""}`}>
              <button
                className={styles.navItem}
                type="button"
                aria-expanded={isSearchOpen}
                onClick={() => setIsSearchOpen((current) => !current)}
              >
                <Search aria-hidden="true" />
                <span>Search</span>
              </button>

              {isSearchOpen && (
                <TagSearchBox
                  variant="sideNav"
                  placeholder="Search"
                  autoFocus
                  onComplete={() => setIsSearchOpen(false)}
                />
              )}
            </div>

            <button
              className={styles.navItem}
              type="button"
              onClick={() => navigate("/gallery")}
            >
              <Image aria-hidden="true" />
              <span>Gallery</span>
            </button>
          </>
        )}

        {showProfile && !isProfileRoute && (
          <button
            className={styles.navItem}
            type="button"
            onClick={openMyProfile}
          >
            <UserRound aria-hidden="true" />
            <span>Profile</span>
          </button>
        )}
      </div>
    </aside>
  )
}
