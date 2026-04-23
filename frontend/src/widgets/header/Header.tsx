import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Header.module.css";
import { useAuth } from "../../app/providers/AuthProvider";
import { LoginModal } from "../../features/auth/ui/LoginModal";

export const Header = () => {
  const { isAuth, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

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

        {isAuth === true && (
          <>
            <button onClick={() => navigate("/profile")}>
              Profile
            </button>

            <button onClick={logout}>
              Log out
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
