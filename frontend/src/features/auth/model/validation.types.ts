export type RegisterField = "loginName" | "password";

export type RegisterValidationErrors = Partial<Record<RegisterField, string>>;
