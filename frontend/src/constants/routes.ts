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
  SUBSCRIPTION_ACTIVATE: "/dashboard/subscription/activate",
  SUBSCRIPTION_UPGRADE: "/dashboard/subscription/upgrade",
  SUBSCRIPTION_DOWNGRADE: "/dashboard/subscription/downgrade",
  SUBSCRIPTION_CANCEL: "/dashboard/subscription/cancel",
  NEW_PRODUCT: "/dashboard/products/new",
  EDIT_PRODUCT: "/dashboard/products/:id/edit",
  DOWNLOAD_REPORT: "/dashboard/reports/:id/download",

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
  ADMIN_SETTINGS:"/admin/settings",
  ADMIN_PRODUCT: "/admin/products",
  ADMIN_VENDOR_ANALYTICS: "/admin/vendors/:id/analytics",
  ADMIN_ACTIVITIES: "/admin/activities",
} as const;
