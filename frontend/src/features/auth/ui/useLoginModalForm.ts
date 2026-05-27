import { useState } from "react"
import type { ApiError } from "@/shared/api/errors/errorTypes"
import type { RegisterRequest } from "../model/request.types"
import {
  validateLoginForm,
  validateRegisterForm,
} from "../model/validation"
import type {
  AuthField,
  AuthValidationErrors,
} from "../model/validation.types"

export type AuthMode = "login" | "signup"

type TouchedState = Record<AuthField, boolean>

const INITIAL_TOUCHED: TouchedState = {
  loginName: false,
  password: false,
}

const INITIAL_FORM: RegisterRequest = {
  loginName: "",
  password: "",
  email: "",
  phone: "",
}

export function useLoginModalForm() {
  const [mode, setMode] = useState<AuthMode>("login")
  const [apiError, setApiError] = useState<ApiError | null>(null)
  const [touched, setTouched] = useState<TouchedState>(INITIAL_TOUCHED)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState<RegisterRequest>(INITIAL_FORM)

  const validationErrors: AuthValidationErrors =
    mode === "login" ? validateLoginForm(form) : validateRegisterForm(form)
  const hasValidationErrors = Object.keys(validationErrors).length > 0

  const getFieldError = (field: AuthField) => {
    if (touched[field] && validationErrors[field]) {
      return validationErrors[field]
    }

    if (apiError?.field === field) {
      return apiError.message
    }

    return null
  }

  const clearApiErrorForField = (field: string) => {
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
  }

  const updateField = (field: AuthField, value: string) => {
    clearApiErrorForField(field)

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const updateOptionalField = (field: "email" | "phone", apiField: string, value: string) => {
    clearApiErrorForField(apiField)

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleBlur = (field: AuthField) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }))
  }

  const touchRequiredFields = () => {
    setTouched({
      loginName: true,
      password: true,
    })
  }

  const switchMode = (nextMode: AuthMode) => {
    setApiError(null)
    setTouched(INITIAL_TOUCHED)
    setShowPassword(false)
    setMode(nextMode)
  }

  return {
    apiError,
    form,
    hasValidationErrors,
    mode,
    showPassword,
    clearApiErrorForField,
    getFieldError,
    handleBlur,
    setApiError,
    setShowPassword,
    switchMode,
    touchRequiredFields,
    updateField,
    updateOptionalField,
  }
}
