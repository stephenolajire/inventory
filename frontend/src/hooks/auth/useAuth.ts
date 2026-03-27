// src/hooks/useAuth.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { QK, STALE } from "../../lib/queryClient";
import { apiGet, apiPost, getApiErrorMessage } from "../../lib/axios";
import { useAuthStore } from "../../store/auth.store";
import { ROUTES } from "../../constants/routes";
import toast from "react-hot-toast";
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  TokenRefreshResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ApiResponse,
} from "../../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface DeleteAccountPayload {
  password: string;
}

interface VerifyEmailPayload {
  token: string;
}

interface ResendVerificationPayload {
  email: string;
}

type LoginMutationResult = UseMutationResult<
  LoginResponse,
  Error,
  LoginRequest
>;

type RegisterMutationResult = UseMutationResult<
  RegisterResponse,
  Error,
  RegisterRequest
>;

type LogoutMutationResult = UseMutationResult<
  void,
  Error,
  void
>;

type ChangePasswordMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean }>,
  Error,
  ChangePasswordRequest
>;

type ForgotPasswordMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean }>,
  Error,
  ForgotPasswordRequest
>;

type ResetPasswordMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean }>,
  Error,
  ResetPasswordRequest
>;

type DeleteAccountMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean }>,
  Error,
  DeleteAccountPayload
>;

type VerifyEmailMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean }>,
  Error,
  VerifyEmailPayload
>;

type ResendVerificationMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean }>,
  Error,
  ResendVerificationPayload
>;

type LoginMutationOptions = UseMutationOptions<
  LoginResponse,
  Error,
  LoginRequest
>;

type RegisterMutationOptions = UseMutationOptions<
  RegisterResponse,
  Error,
  RegisterRequest
>;

type ChangePasswordMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean }>,
  Error,
  ChangePasswordRequest
>;

type ForgotPasswordMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean }>,
  Error,
  ForgotPasswordRequest
>;

type ResetPasswordMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean }>,
  Error,
  ResetPasswordRequest
>;

type DeleteAccountMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean }>,
  Error,
  DeleteAccountPayload
>;

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

const authApi = {
  login: (data: LoginRequest): Promise<LoginResponse> =>
    apiPost<LoginResponse>("/auth/login/", data),

  register: (data: RegisterRequest): Promise<RegisterResponse> =>
    apiPost<RegisterResponse>("/auth/register/", data),

  logout: (refresh: string): Promise<void> =>
    apiPost<void>("/auth/logout/", { refresh }),

  me: (): Promise<ApiResponse<AuthUser>> =>
    apiGet<ApiResponse<AuthUser>>("/auth/me/"),

  refreshToken: (refresh: string): Promise<TokenRefreshResponse> =>
    apiPost<TokenRefreshResponse>("/auth/token/refresh/", { refresh }),

  changePassword: (
    data: ChangePasswordRequest,
  ): Promise<ApiResponse<{ success: boolean }>> =>
    apiPost<ApiResponse<{ success: boolean }>>("/auth/change-password/", data),

  forgotPassword: (
    data: ForgotPasswordRequest,
  ): Promise<ApiResponse<{ success: boolean }>> =>
    apiPost<ApiResponse<{ success: boolean }>>("/auth/password/forgot/", data),

  resetPassword: (
    data: ResetPasswordRequest,
  ): Promise<ApiResponse<{ success: boolean }>> =>
    apiPost<ApiResponse<{ success: boolean }>>("/auth/password/reset/", data),

  verifyEmail: (token: string): Promise<ApiResponse<{ success: boolean }>> =>
    apiPost<ApiResponse<{ success: boolean }>>("/verification/", { token }),

  resendVerification: (
    email: string,
  ): Promise<ApiResponse<{ success: boolean }>> =>
    apiPost<ApiResponse<{ success: boolean }>>("/auth/verify/resend/", {
      email,
    }),

  deleteAccount: (
    password: string,
  ): Promise<ApiResponse<{ success: boolean }>> =>
    apiPost<ApiResponse<{ success: boolean }>>("/auth/delete/", { password }),
};

// ─────────────────────────────────────────────────────────────
// Current user — /auth/me/
// ─────────────────────────────────────────────────────────────

export function useMe(
  options?: Partial<UseQueryOptions<ApiResponse<AuthUser>>>
): UseQueryResult<ApiResponse<AuthUser>> {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser         = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey:  QK.me(),
    queryFn:   authApi.me,
    staleTime: STALE.DEFAULT,
    enabled:   isAuthenticated,
    ...options,
    // Sync store whenever me refreshes
    select: (data) => {
      if (data?.data) setUser(data.data);
      return data;
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────

export function useLogin(
  options?: LoginMutationOptions
): LoginMutationResult {
  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.setAuth);
  const qc       = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),

    onSuccess: (res) => {
      setAuth(res.user, res.access, res.refresh);

      // Prefill me cache immediately so the first render has data
      qc.setQueryData(QK.me(), { success: true, data: res.user });

      // Redirect based on role or redirect_to hint from server
      const dest = res.redirect_to
        ? res.redirect_to
        : res.user.role === "admin"
          ? ROUTES.ADMIN_DASHBOARD
          : ROUTES.DASHBOARD;

      navigate(dest, { replace: true });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Register
// ─────────────────────────────────────────────────────────────

export function useRegister(
  options?: RegisterMutationOptions
): RegisterMutationResult {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────────────────────

export function useLogout(
  options?: UseMutationOptions<void, Error, void>
): LogoutMutationResult {
  const navigate     = useNavigate();
  const clearAuth    = useAuthStore((s) => s.clearAuth);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const qc           = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(refreshToken ?? ""),

    onSuccess: () => {
      clearAuth();
      qc.clear();
      navigate(ROUTES.LOGIN, { replace: true });
    },

    // Clear locally even if the server call fails
    onError: () => {
      clearAuth();
      qc.clear();
      navigate(ROUTES.LOGIN, { replace: true });
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Change password
// ─────────────────────────────────────────────────────────────

export function useChangePassword(
  options?: ChangePasswordMutationOptions
): ChangePasswordMutationResult {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) =>
      authApi.changePassword(data),

    onSuccess: () => {
      toast.success("Password changed successfully.");
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Forgot password
// ─────────────────────────────────────────────────────────────

export function useForgotPassword(
  options?: ForgotPasswordMutationOptions
): ForgotPasswordMutationResult {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) =>
      authApi.forgotPassword(data),

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Reset password
// ─────────────────────────────────────────────────────────────

export function useResetPassword(
  options?: ResetPasswordMutationOptions
): ResetPasswordMutationResult {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: ResetPasswordRequest) =>
      authApi.resetPassword(data),

    onSuccess: () => {
      toast.success("Password reset successfully. Please log in.");
      navigate(ROUTES.LOGIN, { replace: true });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Verify email
// ─────────────────────────────────────────────────────────────

export function useVerifyEmail(
  options?: UseMutationOptions<
    ApiResponse<{ success: boolean }>,
    Error,
    VerifyEmailPayload
  >
): VerifyEmailMutationResult {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: VerifyEmailPayload) =>
      authApi.verifyEmail(payload.token),

    onSuccess: () => {
      toast.success("Email verified. Please log in.");
      navigate(ROUTES.LOGIN, { replace: true });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Resend verification email
// ─────────────────────────────────────────────────────────────

export function useResendVerification(
  options?: UseMutationOptions<
    ApiResponse<{ success: boolean }>,
    Error,
    ResendVerificationPayload
  >
): ResendVerificationMutationResult {
  return useMutation({
    mutationFn: (payload: ResendVerificationPayload) =>
      authApi.resendVerification(payload.email),

    onSuccess: () => {
      toast.success("Verification email resent. Please check your inbox.");
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Delete account
// ─────────────────────────────────────────────────────────────

export function useDeleteAccount(
  options?: DeleteAccountMutationOptions
): DeleteAccountMutationResult {
  const navigate  = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const qc        = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteAccountPayload) =>
      authApi.deleteAccount(payload.password),

    onSuccess: () => {
      clearAuth();
      qc.clear();
      toast.success("Your account has been deleted.");
      navigate(ROUTES.HOME, { replace: true });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Composite hook — exposes everything auth-related
// Use this in layout components that need multiple auth actions
// ─────────────────────────────────────────────────────────────

interface AuthHook {
  // ── State from store ──
  user:                  AuthUser | null;
  isAuthenticated:       boolean;
  isVendor:              boolean;
  isAdmin:               boolean;
  isApproved:            boolean;
  isPendingApproval:     boolean;
  isPendingVerification: boolean;
  isRejected:            boolean;
  isSuspended:           boolean;

  // ── Server state ──
  me: UseQueryResult<ApiResponse<AuthUser>>;

  // ── Mutations ──
  login:               LoginMutationResult;
  logout:              LogoutMutationResult;
  register:            RegisterMutationResult;
  changePassword:      ChangePasswordMutationResult;
  forgotPassword:      ForgotPasswordMutationResult;
  resetPassword:       ResetPasswordMutationResult;
  verifyEmail:         VerifyEmailMutationResult;
  resendVerification:  ResendVerificationMutationResult;
  deleteAccount:       DeleteAccountMutationResult;
}

export function useAuth(): AuthHook {
  const store = useAuthStore();

  const me               = useMe();
  const login            = useLogin();
  const logout           = useLogout();
  const register         = useRegister();
  const changePassword   = useChangePassword();
  const forgotPassword   = useForgotPassword();
  const resetPassword    = useResetPassword();
  const verifyEmail      = useVerifyEmail();
  const resendVerification = useResendVerification();
  const deleteAccount    = useDeleteAccount();

  return {
    user:                  store.user,
    isAuthenticated:       store.isAuthenticated,
    isVendor:              store.isVendor(),
    isAdmin:               store.isAdmin(),
    isApproved:            store.isApproved(),
    isPendingApproval:     store.isPendingApproval(),
    isPendingVerification: store.isPendingVerification(),
    isRejected:            store.isRejected(),
    isSuspended:           store.isSuspended(),
    me,
    login,
    logout,
    register,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    deleteAccount,
  };
}