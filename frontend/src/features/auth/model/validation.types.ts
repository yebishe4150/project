export type AuthField = "loginName" | "password";

export type AuthValidationErrors = Partial<Record<AuthField, string>>;
