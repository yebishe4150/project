import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  Camera,
  CircleUserRound,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  Play,
  Send,
} from "lucide-react"
import { validatePasswordRules } from "@/features/auth/model/validation"
import { logApiError, mapChangePasswordError, mapProfileError } from "@/shared/api/errors/errorMapper"
import type { ApiError } from "@/shared/api/errors/errorTypes"
import styles from "./ProfileContactInfo.module.css"
import { useTranslation } from "react-i18next"

export type ContactInfoValues = {
  email: string
  phoneNumber: string
  login: string
  firstName: string
  secondName: string
  currentPassword: string
  newPassword: string
}

export type ChangePasswordValues = Pick<ContactInfoValues, "currentPassword" | "newPassword">

type Props = {
  initialValues: ContactInfoValues
  onCancel: () => void
  onSave: (values: ContactInfoValues) => void | Promise<void>
  onChangePassword: (values: ChangePasswordValues) => void | Promise<void>
  isSaving?: boolean
}

type Field = {
  key: keyof ContactInfoValues
  icon: ReactNode
  type?: "text" | "email" | "tel" | "password"
  disabled?: boolean
}

const fields: Field[] = [
  {
    key: "email",
    type: "email",
    icon: <Mail aria-hidden="true" />,
  },
  {
    key: "phoneNumber",
    type: "tel",
    icon: <Phone aria-hidden="true" />,
  },
  {
    key: "firstName",
    icon: <CircleUserRound />,
  },
  {
    key: "secondName",
    icon: <CircleUserRound />,
  },
  {
    key: "login",
    icon: <CircleUserRound aria-hidden="true" />,
    disabled: true,
  },
  {
    key: "currentPassword",
    type: "password",
    icon: <Lock aria-hidden="true" />,
  },
]

type SocialItem = {
  key: "instagram" | "telegram" | "vk" | "youtube" | "facebook"
  className: string
  icon: ReactNode
}

const socialItems: SocialItem[] = [
  {
    key: "instagram",
    className: styles.instagram,
    icon: <Camera aria-hidden="true" />,
  },
  {
    key: "telegram",
    className: styles.telegram,
    icon: <Send aria-hidden="true" />,
  },
  {
    key: "vk",
    className: styles.vk,
    icon: <MessageCircle aria-hidden="true" />,
  },
  {
    key: "youtube",
    className: styles.youtube,
    icon: <Play aria-hidden="true" />,
  },
  {
    key: "facebook",
    className: styles.facebook,
    icon: <Globe aria-hidden="true" />,
  },
]

export const ProfileContactInfo = ({ initialValues, onCancel, onSave, onChangePassword, isSaving = false }: Props) => {
  const { t } = useTranslation(["profile", "common", "errors"])
  const fieldLabels: Record<keyof ContactInfoValues, string> = {
    email: t("profile:contactInfo.fields.email"),
    phoneNumber: t("profile:contactInfo.fields.phoneNumber"),
    firstName: t("profile:contactInfo.fields.firstName"),
    secondName: t("profile:contactInfo.fields.lastName"),
    login: t("profile:contactInfo.fields.login"),
    currentPassword: t("profile:contactInfo.fields.password"),
    newPassword: t("profile:contactInfo.placeholders.newPassword"),
  }
  const fieldPlaceholders: Record<keyof ContactInfoValues, string> = {
    email: t("profile:contactInfo.placeholders.email"),
    phoneNumber: t("profile:contactInfo.placeholders.phoneNumber"),
    firstName: t("profile:contactInfo.placeholders.firstName"),
    secondName: t("profile:contactInfo.placeholders.lastName"),
    login: t("profile:contactInfo.placeholders.login"),
    currentPassword: t("profile:contactInfo.placeholders.password"),
    newPassword: t("profile:contactInfo.placeholders.newPassword"),
  }
  const passwordBlockRef = useRef<HTMLDivElement | null>(null)
  const [values, setValues] = useState(initialValues)
  const [isPasswordExpanded, setIsPasswordExpanded] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState({
    currentPassword: false,
    newPassword: false,
  })
  const [visiblePasswords, setVisiblePasswords] = useState({
    currentPassword: false,
    newPassword: false,
  })
  const [apiError, setApiError] = useState<ApiError | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isDisabled = isSaving || isSubmitting

  const resetPasswordBlock = () => {
    setIsPasswordExpanded(false)
    setPasswordTouched({
      currentPassword: false,
      newPassword: false,
    })
    setVisiblePasswords({
      currentPassword: false,
      newPassword: false,
    })
    setApiError(null)
    setValues((current) => ({
      ...current,
      currentPassword: "",
      newPassword: "",
    }))
  }

  useEffect(() => {
    setValues(initialValues)
    setIsPasswordExpanded(false)
    setPasswordTouched({
      currentPassword: false,
      newPassword: false,
    })
    setVisiblePasswords({
      currentPassword: false,
      newPassword: false,
    })
    setApiError(null)
    setIsSubmitting(false)
  }, [initialValues])

  useEffect(() => {
    if (!isPasswordExpanded) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!passwordBlockRef.current?.contains(event.target as Node)) {
        resetPasswordBlock()
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [isPasswordExpanded])

  const passwordValidationErrors = {
    currentPassword: isPasswordExpanded ? validatePasswordRules(values.currentPassword) : undefined,
    newPassword: isPasswordExpanded
      ? validatePasswordRules(values.newPassword) ||
        (values.currentPassword && values.newPassword && values.currentPassword === values.newPassword
          ? t("errors:validation.passwordDifferent")
          : undefined)
      : undefined,
  }

  const getPasswordError = (field: "currentPassword" | "newPassword") => {
    if (passwordTouched[field] && passwordValidationErrors[field]) {
      return passwordValidationErrors[field]
    }

    if (apiError?.field === field) {
      return apiError.message
    }

    return null
  }

  const getFieldError = (field: keyof ContactInfoValues) => {
    if (apiError?.field === field) {
      return apiError.message
    }

    return null
  }

  const updateField = (field: keyof ContactInfoValues, value: string) => {
    if (apiError) {
      setApiError((current) => {
        if (!current) {
          return current
        }

        if (!current.field || current.field === field) {
          return null
        }

        return current
      })
    }

    setValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handlePasswordFocus = () => {
    setIsPasswordExpanded(true)
  }

  const handlePasswordBlur = (field: "currentPassword" | "newPassword") => {
    setPasswordTouched((current) => ({
      ...current,
      [field]: true,
    }))
  }

  const togglePasswordVisibility = (field: "currentPassword" | "newPassword") => {
    setVisiblePasswords((current) => ({
      ...current,
      [field]: !current[field],
    }))
  }

  const handleSave = async () => {
    try {
      setApiError(null)
      setIsSubmitting(true)
      await onSave(values)
    } catch (error) {
      const mappedError = mapProfileError(error)

      logApiError("Could not save profile contact info", mappedError, "warn")
      setApiError(mappedError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordSubmit = async () => {
    if (isPasswordExpanded) {
      setPasswordTouched({
        currentPassword: true,
        newPassword: true,
      })

      if (passwordValidationErrors.currentPassword || passwordValidationErrors.newPassword) {
        setApiError(null)
        return
      }
    }

    try {
      setApiError(null)
      setIsSubmitting(true)
      await onChangePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      resetPasswordBlock()
    } catch (error) {
      const mappedError = mapChangePasswordError(error)

      logApiError("Could not change password", mappedError, "warn")
      setApiError(mappedError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <h2 className={styles.title}>{t("profile:contactInfo.title")}</h2>

        <div className={styles.fields}>
          {fields.map((field) => {
            const fieldError = field.key !== "currentPassword" ? getFieldError(field.key) : null

            return field.key === "currentPassword" ? (
            <div className={styles.field} key={field.key} ref={passwordBlockRef}>
              <span className={styles.label}>
                <span className={styles.labelIcon}>{field.icon}</span>
                {fieldLabels[field.key]}
              </span>

              {!isPasswordExpanded ? (
                <input
                  className={styles.input}
                  type="password"
                  placeholder={fieldPlaceholders[field.key]}
                  value=""
                  disabled={isDisabled}
                  onFocus={handlePasswordFocus}
                  onChange={handlePasswordFocus}
                />
              ) : (
                <div className={styles.passwordPanel}>
                  <label className={styles.passwordField}>
                    <span className={styles.passwordLabel}>{t("profile:contactInfo.password.currentPrompt")}</span>
                    <div className={styles.passwordInputWrap}>
                      <input
                        className={`${styles.input} ${styles.passwordInput} ${getPasswordError("currentPassword") ? styles.inputError : ""}`}
                        type={visiblePasswords.currentPassword ? "text" : "password"}
                        placeholder={t("profile:contactInfo.placeholders.currentPassword")}
                        value={values.currentPassword}
                        disabled={isDisabled}
                        onChange={(event) => updateField("currentPassword", event.target.value)}
                        onBlur={() => handlePasswordBlur("currentPassword")}
                      />
                      <button
                        className={styles.passwordPreviewButton}
                        type="button"
                        aria-label={visiblePasswords.currentPassword ? t("profile:contactInfo.password.hideCurrent") : t("profile:contactInfo.password.showCurrent")}
                        disabled={isDisabled}
                        onClick={() => togglePasswordVisibility("currentPassword")}
                      >
                        {visiblePasswords.currentPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                      </button>
                    </div>
                    {getPasswordError("currentPassword") && (
                      <span className={styles.errorText}>{getPasswordError("currentPassword")}</span>
                    )}
                  </label>

                  <label className={styles.passwordField}>
                    <span className={styles.passwordLabel}>{t("profile:contactInfo.password.newPrompt")}</span>
                    <div className={styles.passwordInputWrap}>
                      <input
                        className={`${styles.input} ${styles.passwordInput} ${getPasswordError("newPassword") ? styles.inputError : ""}`}
                        type={visiblePasswords.newPassword ? "text" : "password"}
                        placeholder={t("profile:contactInfo.placeholders.newPassword")}
                        value={values.newPassword}
                        disabled={isDisabled}
                        onChange={(event) => updateField("newPassword", event.target.value)}
                        onBlur={() => handlePasswordBlur("newPassword")}
                      />
                      <button
                        className={styles.passwordPreviewButton}
                        type="button"
                        aria-label={visiblePasswords.newPassword ? t("profile:contactInfo.password.hideNew") : t("profile:contactInfo.password.showNew")}
                        disabled={isDisabled}
                        onClick={() => togglePasswordVisibility("newPassword")}
                      >
                        {visiblePasswords.newPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                      </button>
                    </div>
                    {getPasswordError("newPassword") && (
                      <span className={styles.errorText}>{getPasswordError("newPassword")}</span>
                    )}
                  </label>

                  {apiError && !apiError.field && (
                    <div className={styles.generalError}>{apiError.message}</div>
                  )}

                  <button className={styles.passwordSubmitButton} type="button" onClick={handlePasswordSubmit} disabled={isDisabled}>
                    {isDisabled ? t("profile:contactInfo.password.submitting") : t("profile:contactInfo.password.submit")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <label className={styles.field} key={field.key}>
              <span className={styles.label}>
                <span className={styles.labelIcon}>{field.icon}</span>
                {fieldLabels[field.key]}
              </span>

              <input
                className={`${styles.input} ${fieldError ? styles.inputError : ""}`}
                type={field.type ?? "text"}
                placeholder={fieldPlaceholders[field.key]}
                value={values[field.key]}
                disabled={field.disabled || isDisabled}
                onChange={(event) => updateField(field.key, event.target.value)}
              />
              {fieldError && (
                <span className={styles.errorText}>{fieldError}</span>
              )}
            </label>
          )
          })}
        </div>

        {apiError && !apiError.field && (
          <div className={styles.generalError}>{apiError.message}</div>
        )}

        <div className={styles.socialTitle}>{t("profile:contactInfo.social.title")}</div>

        <div className={styles.socialRow}>
          {socialItems.map((item) => (
            <button key={item.key} className={`${styles.socialButton} ${item.className}`} type="button" aria-label={t(`profile:contactInfo.social.${item.key}`)}>
              {item.icon}
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelButton} type="button" onClick={onCancel} disabled={isDisabled}>
            {t("common:actions.cancel")}
          </button>
          <button className={styles.saveButton} type="button" onClick={handleSave} disabled={isDisabled}>
            {isDisabled ? t("profile:contactInfo.saving") : t("profile:contactInfo.save")}
          </button>
        </div>
      </div>
    </section>
  )
}
