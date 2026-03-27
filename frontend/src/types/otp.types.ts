// src/types/otp.types.ts

export type OtpPurpose =
  | "email_verification"
  | "password_reset"
  | "change_email"
  | "delete_account"
  | "sensitive_action";

export interface OtpRequestRequest {
  email: string;
  purpose: OtpPurpose;
}

export interface OtpVerifyRequest {
  email: string;
  purpose: OtpPurpose;
  code: string;
}

export interface OtpResendRequest {
  email: string;
  purpose: OtpPurpose;
}

export interface OtpVerifyResponse {
  success: boolean;
  message: string;
  next_action: string;
  reset_session?: string;
}

export interface AuthenticatedOtpRequest {
  purpose: OtpPurpose;
}
