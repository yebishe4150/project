import type {
  ApiResponse,
  ChangePasswordResponseData,
  RegisterResponseData,
  LoginResponseData,
  RefreshResponseData
} from "./model/api.types(raw)";
import type { AuthData, RegisterResult } from "./model/frontTypes";

export function mapRegisterResponse(
  res: ApiResponse<RegisterResponseData>
): RegisterResult {
  return {
    loginName: res.data.loginName,
    message: res.message
  };
}

export function mapLoginResponse(
  res: ApiResponse<LoginResponseData>
): AuthData {
  return {
    accessToken: res.data.accessToken,
    userId: res.data.userId,
    role: res.data.role
  };
}

export function mapRefreshResponse(
  res: ApiResponse<RefreshResponseData>
): Pick<AuthData, "accessToken">  {
  return {
    accessToken: res.data.accessToken
  };
}

export function mapChangePasswordResponse(
  res: ApiResponse<ChangePasswordResponseData>
): Pick<AuthData, "accessToken"> {
  return {
    accessToken: res.data.accessToken
  };
}
