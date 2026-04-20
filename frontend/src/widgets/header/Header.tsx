import { useState } from "react";
import styles from "./Header.module.css";
import { useAuth } from "../../app/providers/AuthProvider";
import { LoginModal } from "../../features/auth/ui/LoginModal";
import { ProfileModal } from "../../features/auth/ui/ProfileModal";

export const Header = () => {
  const { isAuth, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.logo}>PinPet</div>

      <div className={styles.actions}>
        {isAuth === null && <span>Loading...</span>}

        {isAuth === false && (
          <button onClick={() => setIsOpen(true)}>
            Login
          </button>
        )}

        {isAuth === true && (
          <>
            <button onClick={() => setIsProfileOpen(true)}>
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

      {isProfileOpen && (
        <ProfileModal onClose={() => setIsProfileOpen(false)} />
      )}
    </header>
  );
};
