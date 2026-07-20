import { createPortal } from "react-dom";
import styles from "./LoginModal.module.css";
import { useAuth } from "../../../app/providers/useAuth";
import { useToast } from "../../../app/providers/useToast";
import { logApiError, mapAuthError } from "../../../shared/api/errors/errorMapper";
import { useLoginModalForm } from "./useLoginModalForm";
import { useTranslation } from "react-i18next";

type Props = {
  onClose: () => void;
};

export const LoginModal = ({ onClose }: Props) => {
  const { t } = useTranslation(["auth", "notifications"]);
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const {
    apiError,
    form,
    hasValidationErrors,
    mode,
    showPassword,
    getFieldError,
    handleBlur,
    setApiError,
    setShowPassword,
    switchMode,
    touchRequiredFields,
    updateField,
    updateOptionalField,
  } = useLoginModalForm();

  const handleSubmit = async () => {
    touchRequiredFields();

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
          title: t("notifications:auth.loginSuccess.title"),
          message: t("notifications:auth.loginSuccess.message"),
        });
      } else {
        await register(form);

        showToast({
          title: t("notifications:auth.signupSuccess.title"),
          message: t("notifications:auth.signupSuccess.message"),
        });
      }

      onClose();
    } catch (error) {
      const mappedError = mapAuthError(error, mode);

      logApiError(`Auth ${mode} failed`, mappedError, "warn");
      setApiError(mappedError);
    }
  };

  const loginNameError = getFieldError("loginName");
  const passwordError = getFieldError("password");
  const emailError = apiError?.field === "email" ? apiError.message : null;
  const isKnownFieldError = apiError?.field === "loginName" || apiError?.field === "password" || apiError?.field === "email";

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>
          x
        </button>

        <h2>{mode === "login" ? t("auth:login.title") : t("auth:signup.title")}</h2>

        <div className={styles.form}>
          <div className={styles.field}>
            <input
              className={`${styles.input} ${loginNameError ? styles.inputError : ""}`}
              placeholder={t("auth:fields.login")}
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
                placeholder={t("auth:fields.password")}
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                onBlur={() => handleBlur("password")}
              />

              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? t("auth:passwordVisibility.hide") : t("auth:passwordVisibility.show")}
              </button>
            </div>

            {passwordError && (
              <div className={styles.errorText}>{passwordError}</div>
            )}
          </div>

          {mode === "signup" && (
            <>
              <input
                className={`${styles.input} ${emailError ? styles.inputError : ""}`}
                placeholder={t("auth:fields.email")}
                value={form.email}
                onChange={(e) => updateOptionalField("email", "email", e.target.value)}
              />
              {emailError && (
                <div className={styles.errorText}>{emailError}</div>
              )}

              <input
                className={styles.input}
                placeholder={t("auth:fields.phone")}
                value={form.phone}
                onChange={(e) => updateOptionalField("phone", "phoneNumber", e.target.value)}
              />
            </>
          )}

          {apiError && !isKnownFieldError && (
            <div className={styles.generalError}>{apiError.message}</div>
          )}

          <button
            className={styles.button}
            onClick={handleSubmit}
            disabled={hasValidationErrors}
          >
            {mode === "login" ? t("auth:login.submit") : t("auth:signup.submit")}
          </button>
        </div>

        <div className={styles.switch}>
          {mode === "login" ? (
            <p>
              {t("auth:login.noAccount")}{" "}
              <span onClick={() => switchMode("signup")}>{t("auth:login.signupLink")}</span>
            </p>
          ) : (
            <p>
              {t("auth:signup.hasAccount")}{" "}
              <span onClick={() => switchMode("login")}>{t("auth:signup.loginLink")}</span>
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
