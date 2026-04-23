import { useState } from "react";
import { createPortal } from "react-dom";
import styles from "./LoginModal.module.css";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/useToast";
import type { RegisterRequest } from "../model/request.types";
import { mapAuthError } from "../../../shared/api/errors/errorMapper";
import type { ApiError } from "../../../shared/api/errors/errorTypes";

type Props = {
  onClose: () => void;
};

export const LoginModal = ({ onClose }: Props) => {
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [registerError, setRegisterError] = useState<ApiError | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState<RegisterRequest>({
    loginName: "",
    password: "",
    email: "",
    phone: ""
  });

  const resetRegisterError = () => {
    if (registerError) {
      setRegisterError(null);
    }
  };

  const handleSubmit = async () => {
    if (!form.loginName || !form.password) return;

    try {
      if (mode === "login") {
        await login({
          loginName: form.loginName,
          password: form.password
        });

        showToast({
          title: "Авторизация успешна",
          message: "Вы успешно вошли в аккаунт."
        });
      } else {
        setRegisterError(null);
        await register(form);

        showToast({
          title: "Регистрация успешна",
          message: "Аккаунт создан, вы уже авторизованы."
        });
      }

      onClose();
    } catch (error) {
      if (mode === "signup") {
        setRegisterError(mapAuthError(error));
        return;
      }

      console.error("Auth error", error);
    }
  };

  const switchMode = (nextMode: "login" | "signup") => {
    setRegisterError(null);
    setShowPassword(false);
    setMode(nextMode);
  };

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.close} onClick={onClose}>
          x
        </button>

        <h2>{mode === "login" ? "Login" : "Sign up"}</h2>

        <div className={styles.form}>
          <div className={styles.field}>
            <input
              className={`${styles.input} ${registerError?.field === "loginName" ? styles.inputError : ""}`}
              placeholder="Login"
              value={form.loginName}
              onChange={(e) => {
                resetRegisterError();
                setForm((prev) => ({
                  ...prev,
                  loginName: e.target.value
                }));
              }}
            />

            {mode === "signup" && registerError?.field === "loginName" && (
              <div className={styles.errorText}>{registerError.message}</div>
            )}
          </div>

          <div className={styles.field}>
            <div className={styles.passwordField}>
              <input
                className={`${styles.input} ${styles.passwordInput} ${registerError?.field === "password" ? styles.inputError : ""}`}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) => {
                  resetRegisterError();
                  setForm((prev) => ({
                    ...prev,
                    password: e.target.value
                  }));
                }}
              />

              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {mode === "signup" && registerError?.field === "password" && registerError.message && (
              <div className={styles.errorText}>{registerError.message}</div>
            )}
          </div>

          {mode === "signup" && (
            <>
              <input
                className={styles.input}
                placeholder="Email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({
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
                  setForm((prev) => ({
                    ...prev,
                    phone: e.target.value
                  }))
                }
              />
            </>
          )}

          {mode === "signup" && registerError && !registerError.field && (
            <div className={styles.generalError}>{registerError.message}</div>
          )}

          <button
            className={styles.button}
            onClick={handleSubmit}
            disabled={!form.loginName || !form.password}
          >
            {mode === "login" ? "Login" : "Sign up"}
          </button>
        </div>

        <div className={styles.switch}>
          {mode === "login" ? (
            <p>
              No account?{" "}
              <span onClick={() => switchMode("signup")}>Sign up</span>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <span onClick={() => switchMode("login")}>Log in</span>
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
