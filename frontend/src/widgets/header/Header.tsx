import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Image, Search, UserRound } from "lucide-react";
import styles from "./Header.module.css";
import { useAuth } from "../../app/providers/AuthProvider";
import { LoginModal } from "../../features/auth/ui/LoginModal";
import { fetchCurrentUser } from "../../pages/profile/profile.api";

const CURRENT_USER_QUERY_KEY = ["current-user"];

export const Header = () => {
  const { isAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const { data: currentUser } = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    enabled: isAuth === true,
  });

  const profileSlug = currentUser?.nickname || currentUser?.loginName;
  const isProfileRoute = /^\/profile\/[^/]+(?:\/me)?$/.test(location.pathname);

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!searchWrapRef.current?.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isSearchOpen]);

  const handleOpenProfile = () => {
    if (!profileSlug) return;

    navigate(`/profile/${encodeURIComponent(profileSlug)}/me`);
  };

  const submitSearch = () => {
    const nextValue = searchValue.trim();

    setIsSearchOpen(false);

    if (!nextValue) {
      navigate("/gallery");
      return;
    }

    navigate(`/gallery?search=${encodeURIComponent(nextValue)}`);
    setSearchValue("");
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo}>PinPet</div>

      <div className={styles.actions}>
        {isAuth === null && (
          <div className={styles.authLoading} aria-live="polite" aria-label="Checking authorization">
            <span className={styles.authLoadingDot} />
            <span className={styles.authLoadingText}>Checking session</span>
          </div>
        )}

        {isAuth === false && (
          <button onClick={() => setIsOpen(true)}>
            Login
          </button>
        )}

        {isAuth === true && !isProfileRoute && (
          <>
            <div ref={searchWrapRef} className={`${styles.searchWrap} ${isSearchOpen ? styles.searchWrapOpen : ""}`}>
              <button
                className={styles.navButton}
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
                      submitSearch();
                      event.currentTarget.blur();
                    }
                  }}
                />
              )}
            </div>

            <button
              className={`${styles.navButton} ${styles.profileButton}`}
              type="button"
              onClick={handleOpenProfile}
              disabled={!profileSlug}
            >
              <UserRound aria-hidden="true" />
              <span>Profile</span>
            </button>

            <button
              className={styles.navButton}
              type="button"
              onClick={() => navigate("/gallery")}
            >
              <Image aria-hidden="true" />
              <span>Gallery</span>
            </button>
          </>
        )}
      </div>

      {isOpen && (
        <LoginModal onClose={() => setIsOpen(false)} />
      )}
    </header>
  );
};
