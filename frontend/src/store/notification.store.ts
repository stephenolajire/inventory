// src/store/notification.store.ts

import { create } from "zustand";
import type { NotificationListItem, NotificationType } from "../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface NotificationStore {
  // ── State ──
  notifications: NotificationListItem[];
  unreadCount: number;
  isDropdownOpen: boolean;
  isFeedLoading: boolean;
  lastFetchedAt: number | null;

  // ── Notification list ──
  setNotifications: (items: NotificationListItem[]) => void;
  prependNotification: (item: NotificationListItem) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;

  // ── Read state ──
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  decrementUnread: () => void;
  resetUnread: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;

  // ── Dropdown ──
  openDropdown: () => void;
  closeDropdown: () => void;
  toggleDropdown: () => void;

  // ── Loading ──
  setFeedLoading: (v: boolean) => void;
  setLastFetched: () => void;

  // ── Computed helpers ──
  getUnreadItems: () => NotificationListItem[];
  getByType: (type: NotificationType) => NotificationListItem[];
  shouldRefetch: (ttlMs?: number) => boolean;
}

// ─────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
  // ── Initial state ──
  notifications: [],
  unreadCount: 0,
  isDropdownOpen: false,
  isFeedLoading: false,
  lastFetchedAt: null,

  // ── Notification list ──

  setNotifications: (items) => {
    set({ notifications: items });
  },

  // Add a new notification to the top of the list
  // Used when a real-time WebSocket push arrives
  prependNotification: (item) => {
    set((state) => ({
      notifications: [item, ...state.notifications],
      unreadCount: state.unreadCount + (item.is_read ? 0 : 1),
    }));
  },

  removeNotification: (id) => {
    set((state) => {
      const target = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount:
          target && !target.is_read
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
      };
    });
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  // ── Read state ──

  setUnreadCount: (count) => {
    set({ unreadCount: Math.max(0, count) });
  },

  incrementUnread: () => {
    set((state) => ({ unreadCount: state.unreadCount + 1 }));
  },

  decrementUnread: () => {
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  resetUnread: () => {
    set({ unreadCount: 0 });
  },

  markAsRead: (id) => {
    set((state) => {
      const target = state.notifications.find((n) => n.id === id);
      const wasUnread = target && !target.is_read;

      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n,
        ),
        unreadCount: wasUnread
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        is_read: true,
      })),
      unreadCount: 0,
    }));
  },

  // ── Dropdown ──

  openDropdown: () => set({ isDropdownOpen: true }),
  closeDropdown: () => set({ isDropdownOpen: false }),
  toggleDropdown: () =>
    set((state) => ({
      isDropdownOpen: !state.isDropdownOpen,
    })),

  // ── Loading ──

  setFeedLoading: (v) => set({ isFeedLoading: v }),

  setLastFetched: () => set({ lastFetchedAt: Date.now() }),

  // ── Computed helpers ──

  getUnreadItems: () => {
    return get().notifications.filter((n) => !n.is_read);
  },

  getByType: (type) => {
    return get().notifications.filter((n) => n.notification_type === type);
  },

  // Returns true if enough time has passed since the last fetch
  // Default TTL is 30 seconds — avoids hammering the API on
  // every dropdown open
  shouldRefetch: (ttlMs = 30_000) => {
    const last = get().lastFetchedAt;
    if (!last) return true;
    return Date.now() - last > ttlMs;
  },
}));

// ─────────────────────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────────────────────

export const selectNotifications = (s: NotificationStore) => s.notifications;
export const selectUnreadCount = (s: NotificationStore) => s.unreadCount;
export const selectIsDropdownOpen = (s: NotificationStore) => s.isDropdownOpen;
export const selectIsFeedLoading = (s: NotificationStore) => s.isFeedLoading;
