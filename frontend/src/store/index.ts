// src/store/index.ts

export { useAuthStore } from "./auth.store";
export { useCartStore } from "./cart.store";
export { useNotificationStore } from "./notification.store";
export { useThemeStore } from "./theme.store";

// ── Auth selectors ──
export {
  selectUser,
  selectAccessToken,
  selectRefreshToken,
  selectIsAuthenticated,
  selectIsHydrated,
  selectIsVendor,
  selectIsAdmin,
  selectIsApproved,
} from "./auth.store";

// ── Cart selectors ──
export {
  selectCarts,
  selectActiveCartId,
  selectActiveCart,
  selectIsScanning,
  selectLastScannedItem,
  selectIsPaymentOpen,
} from "./cart.store";

// ── Notification selectors ──
export {
  selectNotifications,
  selectUnreadCount,
  selectIsDropdownOpen,
  selectIsFeedLoading,
} from "./notification.store";

