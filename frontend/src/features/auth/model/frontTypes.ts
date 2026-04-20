import type { LoginRequest, RegisterRequest } from "./request.types";

export type AuthContextType = {
  isAuth: boolean | null;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
};

//модель для фронта (логин)
export interface AuthData  {
  accessToken: string;
  userId: string;
  role: string;
};

//модель для регистрации
export interface RegisterResult  {
  loginName: string;
  message: string;
};