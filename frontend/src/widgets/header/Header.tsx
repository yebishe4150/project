import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
  const { data: currentUser } = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    enabled: isAuth === true,
  });

  const profileSlug = currentUser?.nickname || currentUser?.loginName;
  const isProfileRoute = /^\/profile\/[^/]+(?:\/me)?$/.test(location.pathname);
  const handleOpenProfile = () => {
    if (!profileSlug) return;

    navigate(`/profile/${encodeURIComponent(profileSlug)}/me`);
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
          <button onClick={handleOpenProfile} disabled={!profileSlug}>
            Profile
          </button>
        )}
      </div>

      {isOpen && (
        <LoginModal onClose={() => setIsOpen(false)} />
      )}
    </header>
  );
};
