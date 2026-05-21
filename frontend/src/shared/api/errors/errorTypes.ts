export type ApiErrorField =
  | "loginName"
  | "password"
  | "currentPassword"
  | "newPassword"
  | "email"
  | "phoneNumber"
  | "firstName"
  | "secondName"
  | "nickname"
  | "prompt"
  | "file"
  | "tags";

export type ApiError = {
  status: number;
  message: string;
  field?: ApiErrorField;
  path?: string;
  timestamp?: string;
  retryAfter?: number;
  cause?: unknown;
};
