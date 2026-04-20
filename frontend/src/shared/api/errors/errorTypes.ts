export type AuthErrorField = "loginName" | "password";

export type ApiError = {
  status: number;
  message: string;
  field?: AuthErrorField;
};
