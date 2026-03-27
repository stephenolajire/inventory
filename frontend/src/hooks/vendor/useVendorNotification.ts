import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { QK, STALE } from "../../lib/queryClient";
import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  getApiErrorMessage,
} from "../../lib/axios";
import { useAuthStore } from "../../store/auth.store";
import { useNotificationStore } from "../../store/notification.store";
import toast from "react-hot-toast";
import type {
  NotificationListItem,
  NotificationDetail,
  NotificationPreferences,
  UnreadCount,
  NotificationFilters,
  ApiResponse,
  PaginatedResponse,
} from "../../types";

const NOTIF_QK = {
  preferences: () => ["notifications", "preferences"] as const,
} as const;

interface MarkReadPayload {
  id: string;
}
interface DeletePayload {
  id: string;
}

type MarkReadMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean }>,
  Error,
  MarkReadPayload
>;
type MarkAllReadMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean }>,
  Error,
  void
>;
type DeleteMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean }>,
  Error,
  DeletePayload
>;
type ClearAllMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean }>,
  Error,
  void
>;
type MarkReadMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean }>,
  Error,
  MarkReadPayload
>;
type MarkAllReadMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean }>,
  Error,
  void
>;
type DeleteMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean }>,
  Error,
  DeletePayload
>;
type ClearAllMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean }>,
  Error,
  void
>;

const BASE = "/notifications";

const notificationsApi = {
  list: (
    filters?: NotificationFilters,
  ): Promise<PaginatedResponse<NotificationListItem>> => {
    const params: Record<string, unknown> = {};
    if (filters?.type) params.type = filters.type;
    if (filters?.is_read !== undefined) params.is_read = filters.is_read;
    if (filters?.page) params.page = filters.page;
    return apiGet<PaginatedResponse<NotificationListItem>>(`${BASE}/`, {
      params,
    });
  },
  detail: (id: string): Promise<ApiResponse<NotificationDetail>> =>
    apiGet<ApiResponse<NotificationDetail>>(`${BASE}/${id}/`),
  unreadCount: (): Promise<ApiResponse<UnreadCount>> =>
    apiGet<ApiResponse<UnreadCount>>(`${BASE}/unread-count/`),
  preferences: (): Promise<ApiResponse<NotificationPreferences>> =>
    apiGet<ApiResponse<NotificationPreferences>>(`${BASE}/preferences/`),
  markRead: (id: string): Promise<ApiResponse<{ success: boolean }>> =>
    apiPatch<ApiResponse<{ success: boolean }>>(`${BASE}/${id}/read/`),
  markAllRead: (): Promise<ApiResponse<{ success: boolean }>> =>
    apiPost<ApiResponse<{ success: boolean }>>(`${BASE}/mark-all-read/`),
  delete: (id: string): Promise<ApiResponse<{ success: boolean }>> =>
    apiDelete<ApiResponse<{ success: boolean }>>(`${BASE}/${id}/`),
  clearAll: (): Promise<ApiResponse<{ success: boolean }>> =>
    apiDelete<ApiResponse<{ success: boolean }>>(`${BASE}/clear/`),
};

function useIsVendor(): boolean {
  return useAuthStore((s) => s.isVendor());
}

export function useNotificationList(
  filters?: NotificationFilters,
  options?: Partial<UseQueryOptions<PaginatedResponse<NotificationListItem>>>,
): UseQueryResult<PaginatedResponse<NotificationListItem>> {
  const isVendor = useIsVendor();
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  const query = useQuery({
    queryKey: QK.notifications.list(filters as object),
    queryFn: () => notificationsApi.list(filters),
    staleTime: STALE.REALTIME,
    enabled: isVendor,
    ...options,
  });

  const results = query.data?.results;
  useMemo(() => {
    if (results) setNotifications(results);
  }, [results, setNotifications]);

  return query;
}

export function useNotificationDetail(
  id: string,
  options?: Partial<UseQueryOptions<ApiResponse<NotificationDetail>>>,
): UseQueryResult<ApiResponse<NotificationDetail>> {
  const isVendor = useIsVendor();
  return useQuery({
    queryKey: QK.notifications.detail(id),
    queryFn: () => notificationsApi.detail(id),
    staleTime: STALE.DEFAULT,
    enabled: isVendor && !!id,
    ...options,
  });
}

export function useUnreadCount(
  options?: Partial<UseQueryOptions<ApiResponse<UnreadCount>>>,
): UseQueryResult<ApiResponse<UnreadCount>> {
  const isVendor = useIsVendor();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  const query = useQuery({
    queryKey: QK.notifications.unreadCount(),
    queryFn: notificationsApi.unreadCount,
    staleTime: STALE.REALTIME,
    refetchInterval: 30_000,
    enabled: isVendor,
    ...options,
  });

  const count = query.data?.data?.unread_count;
  useMemo(() => {
    if (count !== undefined) setUnreadCount(count);
  }, [count, setUnreadCount]);

  return query;
}

export function useNotificationPreferences(
  options?: Partial<UseQueryOptions<ApiResponse<NotificationPreferences>>>,
): UseQueryResult<ApiResponse<NotificationPreferences>> {
  const isVendor = useIsVendor();
  return useQuery({
    queryKey: NOTIF_QK.preferences(),
    queryFn: notificationsApi.preferences,
    staleTime: STALE.DEFAULT,
    enabled: isVendor,
    ...options,
  });
}

export function useMarkNotificationRead(
  options?: MarkReadMutationOptions,
): MarkReadMutationResult {
  const qc = useQueryClient();
  const notifStore = useNotificationStore();

  return useMutation({
    mutationFn: (payload: MarkReadPayload) =>
      notificationsApi.markRead(payload.id),
    onSuccess: (_data, vars) => {
      notifStore.markAsRead(vars.id);
      qc.invalidateQueries({ queryKey: QK.notifications.list(), exact: false });
      qc.invalidateQueries({
        queryKey: QK.notifications.unreadCount(),
        exact: false,
      });
    },
    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },
    ...options,
  });
}

export function useMarkAllNotificationsRead(
  options?: MarkAllReadMutationOptions,
): MarkAllReadMutationResult {
  const qc = useQueryClient();
  const notifStore = useNotificationStore();

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      notifStore.markAllAsRead();
      qc.invalidateQueries({ queryKey: QK.notifications.list(), exact: false });
      qc.invalidateQueries({
        queryKey: QK.notifications.unreadCount(),
        exact: false,
      });
    },
    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },
    ...options,
  });
}

export function useDeleteNotification(
  options?: DeleteMutationOptions,
): DeleteMutationResult {
  const qc = useQueryClient();
  const notifStore = useNotificationStore();

  return useMutation({
    mutationFn: (payload: DeletePayload) => notificationsApi.delete(payload.id),
    onSuccess: (_data, vars) => {
      notifStore.removeNotification(vars.id);
      qc.invalidateQueries({ queryKey: QK.notifications.list(), exact: false });
      qc.invalidateQueries({
        queryKey: QK.notifications.unreadCount(),
        exact: false,
      });
    },
    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },
    ...options,
  });
}

export function useClearAllNotifications(
  options?: ClearAllMutationOptions,
): ClearAllMutationResult {
  const qc = useQueryClient();
  const notifStore = useNotificationStore();

  return useMutation({
    mutationFn: () => notificationsApi.clearAll(),
    onSuccess: () => {
      notifStore.clearAll();
      qc.invalidateQueries({ queryKey: QK.notifications.list(), exact: false });
      qc.invalidateQueries({
        queryKey: QK.notifications.unreadCount(),
        exact: false,
      });
    },
    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },
    ...options,
  });
}

interface VendorNotificationsHook {
  list: UseQueryResult<PaginatedResponse<NotificationListItem>>;
  unreadCount: UseQueryResult<ApiResponse<UnreadCount>>;
  preferences: UseQueryResult<ApiResponse<NotificationPreferences>>;
  markRead: MarkReadMutationResult;
  markAllRead: MarkAllReadMutationResult;
  deleteOne: DeleteMutationResult;
  clearAll: ClearAllMutationResult;
  notifications: NotificationListItem[];
  unread: number;
  isDropdownOpen: boolean;
  toggleDropdown: () => void;
  closeDropdown: () => void;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
}

export function useVendorNotifications(
  filters?: NotificationFilters,
): VendorNotificationsHook {
  const notifStore = useNotificationStore();

  const list = useNotificationList(filters);
  const unreadCount = useUnreadCount();
  const preferences = useNotificationPreferences();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteOne = useDeleteNotification();
  const clearAll = useClearAllNotifications();

  return {
    list,
    unreadCount,
    preferences,
    markRead,
    markAllRead,
    deleteOne,
    clearAll,
    notifications: notifStore.notifications,
    unread: notifStore.unreadCount,
    isDropdownOpen: notifStore.isDropdownOpen,
    toggleDropdown: notifStore.toggleDropdown,
    closeDropdown: notifStore.closeDropdown,
    isLoading: list.isLoading || unreadCount.isLoading,
    isError: list.isError || unreadCount.isError,
    isFetching: list.isFetching || unreadCount.isFetching,
  };
}
