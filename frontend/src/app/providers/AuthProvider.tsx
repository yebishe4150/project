import { createContext, useContext, useEffect, useState } from "react";
import { checkAuth, register as registerApi, login as loginApi, logout as logoutApi } from "../../features/auth/auth"
import type { AuthContextType } from "@/features/auth/model/frontTypes";
import type { RegisterRequest, LoginRequest } from "@/features/auth/model/request.types";
// CONTEXT
const AuthContext = createContext<AuthContextType | null>(null);

// PROVIDER
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  // bootstrap (проверка при старте)
  useEffect(() => {
    const init = async () => {
      const result = await checkAuth();
      setIsAuth(result);
    };

    init();
  }, []);


  // Register
  const register = async (payload: RegisterRequest) => {
    await registerApi(payload);

    await loginApi({
      loginName: payload.loginName,
      password: payload.password
    });

    setIsAuth(true);
  };

  //авторизация
  const login = async (payload: LoginRequest) => {
    await loginApi(payload);
    setIsAuth(true);
  };

  // LOGOUT
  const logout = async () => {
    await logoutApi();

    setIsAuth(false);
  };

  // PROVIDER VALUE
  return (
    <AuthContext.Provider value={{ isAuth, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

//hook
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};