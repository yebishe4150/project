export type AuthErrorField = "loginName" | "password" | "currentPassword" | "newPassword";

export type ApiError = {
  status: number;
  message: string;
  field?: AuthErrorField;
};
