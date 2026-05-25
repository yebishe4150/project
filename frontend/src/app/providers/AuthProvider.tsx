import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  checkAuth,
  register as registerApi,
  login as loginApi,
  logout as logoutApi,
} from "../../features/auth/auth"
import type { RegisterRequest, LoginRequest } from "@/features/auth/model/request.types"
import { isDevAuthMockEnabled, isDevProfileMockEnabled } from "@/shared/config/devProfileMock"
import { AuthContext } from "./AuthContext"

const AUTH_QUERY_KEY = ["auth-status"]

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient()
  const [isDevAuthorized, setIsDevAuthorized] = useState(isDevAuthMockEnabled)

  const { data, isLoading, isError } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: checkAuth,
    retry: false,
  })

  const isAuth = isDevAuthorized ? true : isLoading ? null : isError ? false : (data ?? false)

  const register = async (payload: RegisterRequest) => {
    if (isDevProfileMockEnabled) {
      setIsDevAuthorized(true)
      queryClient.setQueryData(AUTH_QUERY_KEY, true)
      return
    }

    await registerApi(payload)

    await loginApi({
      loginName: payload.loginName,
      password: payload.password,
    })

    queryClient.setQueryData(AUTH_QUERY_KEY, true)
  }

  const login = async (payload: LoginRequest) => {
    if (isDevProfileMockEnabled) {
      setIsDevAuthorized(true)
      queryClient.setQueryData(AUTH_QUERY_KEY, true)
      return
    }

    await loginApi(payload)
    queryClient.setQueryData(AUTH_QUERY_KEY, true)
  }

  const logout = async () => {
    if (isDevProfileMockEnabled) {
      setIsDevAuthorized(false)
      queryClient.setQueryData(AUTH_QUERY_KEY, false)
      return
    }

    await logoutApi()
    queryClient.setQueryData(AUTH_QUERY_KEY, false)
  }

  return (
    <AuthContext.Provider value={{ isAuth, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
