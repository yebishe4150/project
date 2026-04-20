import { createContext, useMemo, useRef, useState } from "react";
import styles from "./ToastProvider.module.css";
import type { Toast, ToastContextType } from "./toast.types";

export const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const value = useMemo<ToastContextType>(() => ({
    showToast: ({ title, message }) => {
      const id = nextId.current++;

      setToasts((current) => [...current, { id, title, message }]);

      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 3000);
    }
  }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className={styles.viewport}>
        {toasts.map((toast) => (
          <div key={toast.id} className={styles.toast}>
            <p className={styles.title}>{toast.title}</p>
            <p className={styles.message}>{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
