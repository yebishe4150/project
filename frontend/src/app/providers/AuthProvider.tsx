import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  checkAuth,
  register as registerApi,
  login as loginApi,
  logout as logoutApi,
} from "../../features/auth/auth";
import type { AuthContextType } from "@/features/auth/model/frontTypes";
import type {
  RegisterRequest,
  LoginRequest,
} from "@/features/auth/model/request.types";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) {
      return;
    }

    didInitRef.current = true;

    const init = async () => {
      const result = await checkAuth();
      setIsAuth(result);
    };

    void init();
  }, []);

  const register = async (payload: RegisterRequest) => {
    await registerApi(payload);

    await loginApi({
      loginName: payload.loginName,
      password: payload.password,
    });

    setIsAuth(true);
  };

  const login = async (payload: LoginRequest) => {
    await loginApi(payload);
    setIsAuth(true);
  };

  const logout = async () => {
    await logoutApi();
    setIsAuth(false);
  };

  return (
    <AuthContext.Provider value={{ isAuth, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
