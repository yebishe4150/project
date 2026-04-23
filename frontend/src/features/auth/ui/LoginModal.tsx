import { useState } from "react";
import styles from "./LoginModal.module.css";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useToast } from "../../../app/providers/useToast";
import type { RegisterRequest } from "../model/request.types";
import { mapAuthError } from "../../../shared/api/errors/errorMapper";
import type { ApiError } from "../../../shared/api/errors/errorTypes";
import {
  validateLoginForm,
  validateRegisterForm,
} from "../model/validation";
import type {
  AuthField,
  AuthValidationErrors,
} from "../model/validation.types";

type Props = {
  onClose: () => void;
};

type TouchedState = Record<AuthField, boolean>;

const INITIAL_TOUCHED: TouchedState = {
  loginName: false,
  password: false,
};

export const LoginModal = ({ onClose }: Props) => {
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [touched, setTouched] = useState<TouchedState>(INITIAL_TOUCHED);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState<RegisterRequest>({
    loginName: "",
    password: "",
    email: "",
    phone: "",
  });

  const validationErrors: AuthValidationErrors =
    mode === "login" ? validateLoginForm(form) : validateRegisterForm(form);

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const getFieldError = (field: AuthField) => {
    if (touched[field] && validationErrors[field]) {
      return validationErrors[field];
    }

    if (apiError?.field === field) {
      return apiError.message;
    }

    return null;
  };

  const updateField = (field: AuthField, value: string) => {
    if (apiError) {
      setApiError((current) => {
        if (!current) {
          return current;
        }

        if (!current.field || current.field === field) {
          return null;
        }

        return current;
      });
    }

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBlur = (field: AuthField) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleSubmit = async () => {
    setTouched({
      loginName: true,
      password: true,
    });

    if (hasValidationErrors) {
      setApiError(null);
      return;
    }

    try {
      setApiError(null);

      if (mode === "login") {
        await login({
          loginName: form.loginName,
          password: form.password,
        });

        showToast({
          title: "Авторизация успешна",
          message: "Вы успешно вошли в аккаунт.",
        });
      } else {
        await register(form);

        showToast({
          title: "Регистрация успешна",
          message: "Аккаунт создан, вы уже авторизованы.",
        });
      }

      onClose();
    } catch (error) {
      setApiError(mapAuthError(error, mode));
    }
  };

  const switchMode = (nextMode: "login" | "signup") => {
    setApiError(null);
    setTouched(INITIAL_TOUCHED);
    setShowPassword(false);
    setMode(nextMode);
  };

  const loginNameError = getFieldError("loginName");
  const passwordError = getFieldError("password");

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>
          x
        </button>

        <h2>{mode === "login" ? "Login" : "Sign up"}</h2>

        <div className={styles.form}>
          <div className={styles.field}>
            <input
              className={`${styles.input} ${loginNameError ? styles.inputError : ""}`}
              placeholder="Login"
              value={form.loginName}
              onChange={(e) => updateField("loginName", e.target.value)}
              onBlur={() => handleBlur("loginName")}
            />

            {loginNameError && (
              <div className={styles.errorText}>{loginNameError}</div>
            )}
          </div>

          <div className={styles.field}>
            <div className={styles.passwordField}>
              <input
                className={`${styles.input} ${styles.passwordInput} ${passwordError ? styles.inputError : ""}`}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                onBlur={() => handleBlur("password")}
              />

              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {passwordError && (
              <div className={styles.errorText}>{passwordError}</div>
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
                    email: e.target.value,
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
                    phone: e.target.value,
                  }))
                }
              />
            </>
          )}

          {apiError && !apiError.field && (
            <div className={styles.generalError}>{apiError.message}</div>
          )}

          <button
            className={styles.button}
            onClick={handleSubmit}
            disabled={hasValidationErrors}
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
    </div>
  );
};
