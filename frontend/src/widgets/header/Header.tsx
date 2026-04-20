import { useState } from "react";
import styles from "./Header.module.css";

import { useAuth } from "../../app/providers/AuthProvider";
import { LoginModal } from "../../features/auth/ui/LoginModal"

export const Header = () => {
  const { isAuth, logout } = useAuth();

  // 🔥 состояние модалки
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.logo}>PinPet</div>

      <div className={styles.actions}>
        {/* ⏳ пока идет проверка */}
        {isAuth === null && <span>Loading...</span>}

        {/* ❌ не авторизован */}
        {isAuth === false && (
          <button onClick={() => setIsOpen(true)}>
            Login
          </button>
        )}

        {/* ✅ авторизован */}
        {isAuth === true && (
          <button onClick={logout}>
            Profile
          </button>
        )}
      </div>

      {/* 🔥 модалка */}
      {isOpen && (
        <LoginModal onClose={() => setIsOpen(false)} />
      )}
    </header>
  );
};