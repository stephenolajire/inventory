// src/hooks/admin/useAdminNotifications.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { STALE } from "../../lib/queryClient";
import { apiGet, apiDelete, getApiErrorMessage } from "../../lib/axios";
import { useAuthStore } from "../../store/auth.store";
import toast from "react-hot-toast";
import type {
  NotificationListItem,
  NotificationDetail,
  NotificationStats,
  ApiResponse,
  PaginatedResponse,
} from "../../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AdminNotificationFilters {
  vendor?:  string;
  type?:    string;
  channel?: string;
  page?:    number;
}

interface CleanupPayload {
  days: number;
}

interface CleanupResponse {
  deleted_count: number;
  message:       string;
}

type CleanupMutationResult = UseMutationResult<
  ApiResponse<CleanupResponse>,
  Error,
  CleanupPayload
>;

type CleanupMutationOptions = UseMutationOptions<
  ApiResponse<CleanupResponse>,
  Error,
  CleanupPayload
>;

// ─────────────────────────────────────────────────────────────
// Local query keys
// ─────────────────────────────────────────────────────────────

const ADMIN_NOTIF_QK = {
  list:   (f?: object) => ["admin", "notifications", "list", f] as const,
  detail: (id: string) => ["admin", "notifications", "detail", id] as const,
  stats:  ()           => ["admin", "notification-stats"] as const,
} as const;

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

const BASE = "/notifications/admin";

const adminNotificationsApi = {

  list: (
    filters?: AdminNotificationFilters
  ): Promise<PaginatedResponse<NotificationListItem>> => {
    const params: Record<string, unknown> = {};
    if (filters?.vendor)  params.vendor  = filters.vendor;
    if (filters?.type)    params.type    = filters.type;
    if (filters?.channel) params.channel = filters.channel;
    if (filters?.page)    params.page    = filters.page;
    return apiGet<PaginatedResponse<NotificationListItem>>(
      `${BASE}/`,
      { params }
    );
  },

  detail: (id: string): Promise<ApiResponse<NotificationDetail>> =>
    apiGet<ApiResponse<NotificationDetail>>(`${BASE}/${id}/`),

  stats: (): Promise<ApiResponse<NotificationStats>> =>
    apiGet<ApiResponse<NotificationStats>>(`${BASE}/stats/`),

  cleanup: (
    payload: CleanupPayload
  ): Promise<ApiResponse<CleanupResponse>> =>
    apiDelete<ApiResponse<CleanupResponse>>(
      `${BASE}/cleanup/`,
      { params: { days: payload.days } }
    ),
};

// ─────────────────────────────────────────────────────────────
// Guard
// ─────────────────────────────────────────────────────────────

function useIsAdmin(): boolean {
  return useAuthStore((s) => s.isAdmin());
}

// ─────────────────────────────────────────────────────────────
// List all notifications
// ─────────────────────────────────────────────────────────────

export function useAdminNotifications(
  filters?:  AdminNotificationFilters,
  options?:  Partial<UseQueryOptions<PaginatedResponse<NotificationListItem>>>
): UseQueryResult<PaginatedResponse<NotificationListItem>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey:  ADMIN_NOTIF_QK.list(filters as object),
    queryFn:   () => adminNotificationsApi.list(filters),
    staleTime: STALE.DEFAULT,
    enabled:   isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Single notification detail
// ─────────────────────────────────────────────────────────────

export function useAdminNotificationDetail(
  id:       string,
  options?: Partial<UseQueryOptions<ApiResponse<NotificationDetail>>>
): UseQueryResult<ApiResponse<NotificationDetail>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey:  ADMIN_NOTIF_QK.detail(id),
    queryFn:   () => adminNotificationsApi.detail(id),
    staleTime: STALE.DEFAULT,
    enabled:   isAdmin && !!id,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Notification stats
// ─────────────────────────────────────────────────────────────

export function useAdminNotificationStats(
  options?: Partial<UseQueryOptions<ApiResponse<NotificationStats>>>
): UseQueryResult<ApiResponse<NotificationStats>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey:  ADMIN_NOTIF_QK.stats(),
    queryFn:   adminNotificationsApi.stats,
    staleTime: STALE.DEFAULT,
    enabled:   isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Cleanup old notifications
// ─────────────────────────────────────────────────────────────

export function useAdminCleanupNotifications(
  options?: CleanupMutationOptions
): CleanupMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CleanupPayload) =>
      adminNotificationsApi.cleanup(payload),

    onSuccess: (res) => {
      const count = res?.data?.deleted_count ?? 0;
      toast.success(`Cleaned up ${count} notification${count === 1 ? "" : "s"}.`);
      qc.invalidateQueries({ queryKey: ADMIN_NOTIF_QK.list()  });
      qc.invalidateQueries({ queryKey: ADMIN_NOTIF_QK.stats() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Composite hook — admin notifications dashboard
// ─────────────────────────────────────────────────────────────

interface AdminNotificationsDashboard {
  notifications: UseQueryResult<PaginatedResponse<NotificationListItem>>;
  stats:         UseQueryResult<ApiResponse<NotificationStats>>;
  cleanup:       CleanupMutationResult;
  isLoading:     boolean;
  isError:       boolean;
  isFetching:    boolean;
}

export function useAdminNotificationsDashboard(
  filters?: AdminNotificationFilters
): AdminNotificationsDashboard {
  const notifications = useAdminNotifications(filters);
  const stats         = useAdminNotificationStats();
  const cleanup       = useAdminCleanupNotifications();

  return {
    notifications,
    stats,
    cleanup,
    isLoading:  notifications.isLoading  || stats.isLoading,
    isError:    notifications.isError    || stats.isError,
    isFetching: notifications.isFetching || stats.isFetching,
  };
}