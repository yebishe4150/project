export type ApiError = {
  status: number;
  message: string;
  field?: "login" | "password";
};