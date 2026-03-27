// src/lib/axios.ts

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "../store/auth.store";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API_PREFIX = "/api";
const TIMEOUT_MS = 15_000;

// Endpoints that do not need an Authorization header
const PUBLIC_ROUTES = [
  "/auth/login/",
  "/auth/register/",
  "/auth/token/refresh/",
  "/auth/otp/request/",
  "/auth/otp/verify/",
  "/auth/otp/resend/",
  "/auth/verify/",
  "/auth/password/forgot/",
  "/auth/password/reset/",
  "/subscriptions/plans/",
  "/geography/countries/",
  "/geography/states/",
  "/geography/lgas/",
];

// ─────────────────────────────────────────────────────────────
// Token refresh state
// Prevents multiple concurrent requests all trying to refresh
// the token at the same time — only the first one fires,
// the rest wait for the same promise to resolve.
// ─────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeToTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function notifySubscribers(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

// ─────────────────────────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  timeout: TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// ─────────────────────────────────────────────────────────────
// Request interceptor
// Attaches the JWT access token to every non-public request.
// ─────────────────────────────────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const url = config.url ?? "";

    // Skip auth header for public routes
    const isPublic = PUBLIC_ROUTES.some((route) => url.includes(route));
    if (isPublic) return config;

    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers = config.headers ?? {};
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ─────────────────────────────────────────────────────────────
// Response interceptor
// Handles 401 responses by attempting a silent token refresh.
// If the refresh succeeds, the original request is retried
// with the new access token.
// If the refresh fails, the user is logged out.
// ─────────────────────────────────────────────────────────────

api.interceptors.response.use(
  (response: AxiosResponse) => response,

  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // ── Only handle 401s that have not already been retried ──
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // ── Do not retry the refresh endpoint itself ──
    if (originalRequest.url?.includes("/auth/token/refresh/")) {
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // ── If already refreshing, queue this request ──
    if (isRefreshing) {
      return new Promise<AxiosResponse>((resolve) => {
        subscribeToTokenRefresh((newToken) => {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    // ── Start the refresh ──
    isRefreshing = true;

    const refreshToken = useAuthStore.getState().refreshToken;

    if (!refreshToken) {
      isRefreshing = false;
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(
        `${BASE_URL}${API_PREFIX}/auth/token/refresh/`,
        { refresh: refreshToken },
        { headers: { "Content-Type": "application/json" } },
      );

      const newAccess = data.access;
      const newRefresh = data.refresh;

      // ── Update store with new tokens ──
      useAuthStore.getState().setTokens(newAccess, newRefresh);

      // ── Notify all queued requests ──
      notifySubscribers(newAccess);

      // ── Retry the original request ──
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;

      return api(originalRequest);
    } catch (refreshError) {
      // ── Refresh failed — log the user out ──
      notifySubscribers("");
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export const apiGet = <T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> => api.get<T>(url, config).then((r) => r.data);


// Add after apiGet, before apiPost

export const apiGetBlob = (
  url: string,
  config?: AxiosRequestConfig,
): Promise<Blob> =>
  api
    .get(url, { ...config, responseType: "blob" })
    .then((r) => r.data as Blob);

export const apiPost = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> => api.post<T>(url, data, config).then((r) => r.data);

export const apiPatch = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> => api.patch<T>(url, data, config).then((r) => r.data);

export const apiPut = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> => api.put<T>(url, data, config).then((r) => r.data);

export const apiDelete = <T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> => api.delete<T>(url, config).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// Multipart helper — for file / image uploads
// ─────────────────────────────────────────────────────────────

export const apiUpload = <T>(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
): Promise<T> =>
  api
    .patch<T>(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      },
    })
    .then((r) => r.data);
    

// ─────────────────────────────────────────────────────────────
// Error helper
// Extracts a human-readable message from any axios error
// for use in catch blocks across all API files.
// ─────────────────────────────────────────────────────────────

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    // Our API always returns { success: false, message: "..." }
    if (data?.message) return data.message;

    // Field-level validation errors — flatten to first message
    if (data?.errors) {
      const firstField = Object.values(data.errors)[0];
      if (Array.isArray(firstField) && firstField.length > 0) {
        return firstField[0] as string;
      }
    }

    // HTTP status fallbacks
    switch (error.response?.status) {
      case 400:
        return "Invalid request. Please check your input.";
      case 401:
        return "Your session has expired. Please log in again.";
      case 403:
        return "You do not have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 409:
        return "A conflict occurred. Please try again.";
      case 422:
        return "Validation failed. Please check your input.";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
        return "A server error occurred. Please try again later.";
      case 503:
        return "Service temporarily unavailable. Please try again shortly.";
      default:
        return "Something went wrong. Please try again.";
    }
  }

  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}

// ─────────────────────────────────────────────────────────────
// Export the instance for direct use if needed
// ─────────────────────────────────────────────────────────────

export default api;
