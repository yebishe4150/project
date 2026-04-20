//сырой формат данных,приходящих с бэка

// универсальный контейнер
export interface ApiResponse<T>  {
  data: T;
  message: string;
};

//рефреш
export interface RefreshResponseData  {
  accessToken: string;
};

// REGISTER
export interface RegisterResponseData  {
  loginName: string;
};

// LOGIN
export interface LoginResponseData  {
  accessToken: string;
  refreshToken?: string;
  userId: string;
  role: string;
};