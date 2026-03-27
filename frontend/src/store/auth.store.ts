// src/store/auth.store.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser} from "../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AuthStore {
  // ── State ──
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  // ── Setters ──
  setAuth: (user: AuthUser, access: string, refresh: string) => void;
  setUser: (user: AuthUser) => void;
  setTokens: (access: string, refresh: string) => void;
  setAccessToken: (access: string) => void;
  setHydrated: (value: boolean) => void;

  // ── Clearers ──
  clearAuth: () => void;

  // ── Computed helpers ──
  isVendor: () => boolean;
  isAdmin: () => boolean;
  isApproved: () => boolean;
  isPendingApproval: () => boolean;
  isPendingVerification: () => boolean;
  isRejected: () => boolean;
  isSuspended: () => boolean;
  hasAnalytics: () => boolean;
  hasReports: () => boolean;
}

// ─────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ──
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: false,

      // ── Set full auth after login ──
      setAuth: (user, access, refresh) => {
        set({
          user,
          accessToken: access,
          refreshToken: refresh,
          isAuthenticated: true,
        });
      },

      // ── Update user only (e.g. after profile update) ──
      setUser: (user) => {
        set({ user });
      },

      // ── Update both tokens (e.g. after token rotation) ──
      setTokens: (access, refresh) => {
        set({ accessToken: access, refreshToken: refresh });
      },

      // ── Update access token only ──
      setAccessToken: (access) => {
        set({ accessToken: access });
      },

      // ── Mark store as hydrated from storage ──
      setHydrated: (value) => {
        set({ isHydrated: value });
      },

      // ── Clear everything on logout ──
      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      // ── Computed: role helpers ──
      isVendor: () => get().user?.role === "vendor",
      isAdmin: () => get().user?.role === "admin",

      // ── Computed: status helpers ──
      isApproved: () => get().user?.status === "approved",
      isPendingApproval: () => get().user?.status === "pending_approval",
      isPendingVerification: () =>
        get().user?.status === "pending_verification",
      isRejected: () => get().user?.status === "rejected",
      isSuspended: () => get().user?.status === "suspended",

      // ── Computed: plan feature flags ──
      // These are set on the user object after login via the subscription
      // endpoint — the backend embeds them in the MeSerializer response
      hasAnalytics: () => {
        const user = get().user as any;
        return user?.has_analytics ?? false;
      },
      hasReports: () => {
        const user = get().user as any;
        return user?.has_reports ?? false;
      },
    }),

    {
      name: "stocksense-auth",
      storage: createJSONStorage(() => localStorage),

      // Only persist tokens and user — do not persist computed flags
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),

      // Mark store as hydrated once rehydration is complete
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

// ─────────────────────────────────────────────────────────────
// Selectors — use these in components for cleaner reads
// ─────────────────────────────────────────────────────────────

export const selectUser = (s: AuthStore) => s.user;
export const selectAccessToken = (s: AuthStore) => s.accessToken;
export const selectRefreshToken = (s: AuthStore) => s.refreshToken;
export const selectIsAuthenticated = (s: AuthStore) => s.isAuthenticated;
export const selectIsHydrated = (s: AuthStore) => s.isHydrated;
export const selectIsVendor = (s: AuthStore) => s.isVendor();
export const selectIsAdmin = (s: AuthStore) => s.isAdmin();
export const selectIsApproved = (s: AuthStore) => s.isApproved();
