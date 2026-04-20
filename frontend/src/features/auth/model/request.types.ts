export interface RegisterRequest {
  loginName: string;
  password: string;
  email?: string;
  phone?: string;
}

export interface LoginRequest {
  loginName: string,
  password: string
}

export interface RefreshRequest {
  accessToken: string;
};
