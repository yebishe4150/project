import { useState } from "react";
import styles from "./LoginModal.module.css";
import { useAuth } from "../../../app/providers/AuthProvider";
import type { RegisterRequest } from "../model/request.types";

type Props = {
  onClose: () => void;
};


export const LoginModal = ({ onClose }: Props) => {
  const { login, register } = useAuth();

  // 🔥 режим модалки
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [form, setForm] = useState<RegisterRequest>({
    loginName: "",
    password: "",
    email: "",
    phone: ""
  });

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = async () => {
    if (!form.loginName || !form.password) return;

    try {
      if (mode === "login") {
        await login({
          loginName: form.loginName,
          password: form.password
        });
      } else {
        await register(form);
      }

      onClose();

    } catch (e) {
      console.error("Auth error", e);
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ❌ закрыть */}
        <button className={styles.close} onClick={onClose}>
          ✕
        </button>

        {/* 🔥 заголовок */}
        <h2>
          {mode === "login" ? "Login" : "Sign up"}
        </h2>

        <div className={styles.form}>
          {/* username */}
          <input
            className={styles.input}
            placeholder="Login"
            value={form.loginName}
            onChange={(e) =>
              setForm(prev => ({
                ...prev,
                loginName: e.target.value
              }))
            }
          />

          {/* password */}
          <input
            className={styles.input}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm(prev => ({
                ...prev,
                password: e.target.value
              }))
            }
          />

          {/* 🔥 дополнительные поля */}
          {mode === "signup" && (
            <>
              <input
                className={styles.input}
                placeholder="Email"
                value={form.email}
                onChange={(e) =>
                  setForm(prev => ({
                    ...prev,
                    email: e.target.value
                  }))
                }
              />

              <input
                className={styles.input}
                placeholder="Phone"
                value={form.phone}
                onChange={(e) =>
                  setForm(prev => ({
                    ...prev,
                    phone: e.target.value
                  }))
                }
              />
            </>
          )}

          {/* кнопка */}
          <button
            className={styles.button}
            onClick={handleSubmit}
            disabled={!form.loginName || !form.password}
          >
            {mode === "login" ? "Login" : "Sign up"}
          </button>
        </div>

        {/* 🔁 переключение */}
        <div className={styles.switch}>
          {mode === "login" ? (
            <p>
              Нет аккаунта?{" "}
              <span onClick={() => setMode("signup")}>
                Зарегистрироваться
              </span>
            </p>
          ) : (
            <p>
              Уже есть аккаунт?{" "}
              <span onClick={() => setMode("login")}>
                Войти
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};