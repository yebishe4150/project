import { Image, Search, UserRound, Home } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/app/providers/AuthProvider"
import { fetchCurrentUser } from "@/pages/profile/profile.api"
import styles from "./DesktopSideNav.module.css"

const CURRENT_USER_QUERY_KEY = ["current-user"]
const CURRENT_PROFILE_FALLBACK_SLUG = "current"

export const DesktopSideNav = () => {
  const { isAuth } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const searchWrapRef = useRef<HTMLDivElement | null>(null)
  const { data: currentUser } = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    enabled: isAuth === true,
  })

  const profileSlug = currentUser?.nickname || currentUser?.loginName
  const showProfile = isAuth === true
  const isGalleryRoute = location.pathname === "/gallery"

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus()
    }
  }, [isSearchOpen])

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

  const submitSearch = () => {
    const nextValue = searchValue.trim()

    setIsSearchOpen(false)

    if (!nextValue) {
      navigate("/gallery")
      return
    }

    navigate(`/gallery?search=${encodeURIComponent(nextValue)}`)
    setSearchValue("")
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
                <input
                  ref={searchInputRef}
                  className={styles.searchInput}
                  type="search"
                  aria-label="Search"
                  placeholder="Search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      submitSearch()
                      event.currentTarget.blur()
                    }
                  }}
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

        {showProfile && (
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
