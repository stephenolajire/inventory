// src/types/auth.types.ts

export type UserRole = "vendor" | "admin";
export type UserStatus =
  | "pending_verification"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "suspended";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  email_verified: boolean;
  email_verified_at: string | null;
  approved_at: string | null;
  last_login: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: AuthUser;
  access: string;
  refresh: string;
  redirect_to?: string;
  code?: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  plan: string;
  billing_cycle: "monthly" | "yearly";
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export interface TokenRefreshResponse {
  success: boolean;
  access: string;
  refresh: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
  confirm_password: string;
}
