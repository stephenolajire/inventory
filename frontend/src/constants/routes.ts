// src/constants/routes.ts — add these if not already present

export const ROUTES = {
  // ── Public ──
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
  PENDING: "/pending",

  // ── Vendor ──
  DASHBOARD: "/dashboard",
  STOREKEEPER: "/dashboard/storekeeper",
  PRODUCTS: "/dashboard/products",
  CATEGORIES: "/dashboard/categories",
  ANALYTICS: "/dashboard/analytics",
  REPORTS: "/dashboard/reports",
  NOTIFICATIONS: "/dashboard/notifications",
  SUBSCRIPTION: "/dashboard/subscription",
  SETTINGS: "/dashboard/settings",
  SALES: "/dashboard/sales",

  // ── Admin ──
  ADMIN_DASHBOARD: "/admin",
  ADMIN_VENDORS: "/admin/vendors",
  ADMIN_USERS: "/admin/users",
  ADMIN_SALES: "/admin/sales",
  ADMIN_REPORTS: "/admin/reports",
  ADMIN_SUBSCRIPTIONS: "/admin/subscriptions",
  ADMIN_SCANNERS: "/admin/scanners",
  ADMIN_ANALYTICS: "/admin/analytics",
  ADMIN_NOTIFICATIONS: "/admin/notifications",
  ADMIN_PENDING_VENDORS:"/admin/pending-vendors",
  ADMIN_SETTINGS:"/admin/settings"
} as const;
