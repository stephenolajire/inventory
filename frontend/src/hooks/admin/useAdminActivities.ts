// src/hooks/admin/useAdminActivities.ts

import {
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { QK, STALE } from "../../lib/queryClient";
import { apiGet } from "../../lib/axios";
import { useAuthStore } from "../../store/auth.store";
import type {
  ActivityListItem,
  ActivityDetail,
  ActivityStatistics,
  ActionTypeOption,
  ActivityFilters,
  ApiResponse,
  PaginatedResponse,
} from "../../types";

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

const BASE = "/activities";

const adminActivitiesApi = {
  /**
   * List all activities with filters and search
   */
  list: (
    filters?: ActivityFilters,
  ): Promise<PaginatedResponse<ActivityListItem>> => {
    const params: Record<string, unknown> = {};
    if (filters?.user) params.user = filters.user;
    if (filters?.action_type) params.action_type = filters.action_type;
    if (filters?.content_type) params.content_type = filters.content_type;
    if (filters?.search) params.search = filters.search;
    if (filters?.page) params.page = filters.page;
    return apiGet<PaginatedResponse<ActivityListItem>>(`${BASE}/`, {
      params,
    });
  },

  /**
   * Get a specific activity
   */
  detail: (id: string): Promise<ApiResponse<ActivityDetail>> =>
    apiGet<ApiResponse<ActivityDetail>>(`${BASE}/${id}/`),

  /**
   * Get current user's activities
   */
  myActivities: (
    filters?: ActivityFilters,
  ): Promise<PaginatedResponse<ActivityListItem>> => {
    const params: Record<string, unknown> = {};
    if (filters?.action_type) params.action_type = filters.action_type;
    if (filters?.search) params.search = filters.search;
    if (filters?.page) params.page = filters.page;
    return apiGet<PaginatedResponse<ActivityListItem>>(
      `${BASE}/my_activities/`,
      { params },
    );
  },

  /**
   * Get activities for a specific user (admin only)
   */
  userActivities: (
    userId: string,
    filters?: ActivityFilters,
  ): Promise<PaginatedResponse<ActivityListItem>> => {
    const params: Record<string, unknown> = {
      user_id: userId,
    };
    if (filters?.action_type) params.action_type = filters.action_type;
    if (filters?.page) params.page = filters.page;
    return apiGet<PaginatedResponse<ActivityListItem>>(
      `${BASE}/user_activities/`,
      { params },
    );
  },

  /**
   * Get activities filtered by action type (admin only)
   */
  byActionType: (
    actionType: string,
    filters?: ActivityFilters,
  ): Promise<PaginatedResponse<ActivityListItem>> => {
    const params: Record<string, unknown> = {
      action_type: actionType,
    };
    if (filters?.page) params.page = filters.page;
    return apiGet<PaginatedResponse<ActivityListItem>>(
      `${BASE}/by_action_type/`,
      { params },
    );
  },

  /**
   * Get activity statistics (admin only)
   */
  statistics: (): Promise<ApiResponse<ActivityStatistics>> =>
    apiGet<ApiResponse<ActivityStatistics>>(`${BASE}/statistics/`),

  /**
   * Get all available action types (cached)
   */
  actionTypes: (): Promise<ActionTypeOption[]> =>
    apiGet<ActionTypeOption[]>(`${BASE}/action_types/`),
};

// ─────────────────────────────────────────────────────────────
// Guard — only admin users can use these hooks
// ─────────────────────────────────────────────────────────────

function useIsAdmin(): boolean {
  return useAuthStore((s) => s.isAdmin());
}

// ─────────────────────────────────────────────────────────────
// List activities
// ─────────────────────────────────────────────────────────────

/**
 * List all activities with advanced filtering and search.
 * Non-admins can only see their own activities.
 *
 * Usage:
 * ```ts
 * const { data, isLoading } = useAdminActivities();
 * // or with filters:
 * const { data } = useAdminActivities({
 *   action_type: 'product_uploaded',
 *   search: 'nike',
 *   page: 2,
 * });
 * ```
 */
export function useAdminActivities(
  filters?: ActivityFilters,
  options?: Partial<UseQueryOptions<PaginatedResponse<ActivityListItem>>>,
): UseQueryResult<PaginatedResponse<ActivityListItem>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: QK.admin.activities(filters),
    queryFn: () => adminActivitiesApi.list(filters),
    staleTime: STALE.DEFAULT,
    enabled: isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Retrieve single activity
// ─────────────────────────────────────────────────────────────

/**
 * Get a specific activity with all details.
 *
 * Usage:
 * ```ts
 * const { data } = useAdminActivity(activityId);
 * ```
 */
export function useAdminActivity(
  id: string,
  options?: Partial<UseQueryOptions<ApiResponse<ActivityDetail>>>,
): UseQueryResult<ApiResponse<ActivityDetail>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: QK.admin.activity(id),
    queryFn: () => adminActivitiesApi.detail(id),
    staleTime: STALE.DEFAULT,
    enabled: isAdmin && !!id,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// My activities
// ─────────────────────────────────────────────────────────────

/**
 * Get current user's activities.
 * Available to all authenticated users.
 *
 * Usage:
 * ```ts
 * const { data } = useMyActivities();
 * ```
 */
export function useMyActivities(
  filters?: ActivityFilters,
  options?: Partial<UseQueryOptions<PaginatedResponse<ActivityListItem>>>,
): UseQueryResult<PaginatedResponse<ActivityListItem>> {
  return useQuery({
    queryKey: ["activities", "my", filters],
    queryFn: () => adminActivitiesApi.myActivities(filters),
    staleTime: STALE.DEFAULT,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// User activities (admin only)
// ─────────────────────────────────────────────────────────────

/**
 * Get activities for a specific user (admin only).
 *
 * Usage:
 * ```ts
 * const { data } = useUserActivities(userId);
 * ```
 */
export function useUserActivities(
  userId: string,
  filters?: ActivityFilters,
  options?: Partial<UseQueryOptions<PaginatedResponse<ActivityListItem>>>,
): UseQueryResult<PaginatedResponse<ActivityListItem>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: QK.admin.activities({ ...filters, user: userId }),
    queryFn: () => adminActivitiesApi.userActivities(userId, filters),
    staleTime: STALE.DEFAULT,
    enabled: isAdmin && !!userId,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Activities by action type (admin only)
// ─────────────────────────────────────────────────────────────

/**
 * Get activities filtered by action type (admin only).
 *
 * Usage:
 * ```ts
 * const { data } = useActivitiesByActionType('product_uploaded');
 * ```
 */
export function useActivitiesByActionType(
  actionType: string,
  filters?: ActivityFilters,
  options?: Partial<UseQueryOptions<PaginatedResponse<ActivityListItem>>>,
): UseQueryResult<PaginatedResponse<ActivityListItem>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: QK.admin.activities({ ...filters, action_type: actionType }),
    queryFn: () => adminActivitiesApi.byActionType(actionType, filters),
    staleTime: STALE.DEFAULT,
    enabled: isAdmin && !!actionType,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Activity statistics (admin only)
// ─────────────────────────────────────────────────────────────

/**
 * Get activity statistics for admin dashboard.
 * Returns total activities, last 7 days count, top action types, and top users.
 *
 * Usage:
 * ```ts
 * const { data } = useActivityStatistics();
 * if (data?.data) {
 *   console.log(data.data.total_activities);
 *   console.log(data.data.top_action_types);
 * }
 * ```
 */
export function useActivityStatistics(
  options?: Partial<UseQueryOptions<ApiResponse<ActivityStatistics>>>,
): UseQueryResult<ApiResponse<ActivityStatistics>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: QK.admin.activityStats(),
    queryFn: adminActivitiesApi.statistics,
    staleTime: STALE.DEFAULT,
    enabled: isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Action types (cached)
// ─────────────────────────────────────────────────────────────

/**
 * Get all available action types for filtering.
 * Cached for 5 minutes on the server.
 *
 * Usage:
 * ```ts
 * const { data } = useActivityActionTypes();
 * // data contains: [{ value: 'product_uploaded', display: 'Uploaded Product' }, ...]
 * ```
 */
export function useActivityActionTypes(
  options?: Partial<UseQueryOptions<ActionTypeOption[]>>,
): UseQueryResult<ActionTypeOption[]> {
  return useQuery({
    queryKey: QK.admin.actionTypes(),
    queryFn: adminActivitiesApi.actionTypes,
    staleTime: STALE.STATIC, // Cache for 1 hour
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Invalidate activities cache to force refresh.
 * Useful after performing actions that create new activities.
 *
 * Usage:
 * ```ts
 * const queryClient = useQueryClient();
 * // After an action that creates an activity:
 * invalidateActivitiesCache(queryClient);
 * ```
 */
export function invalidateActivitiesCache(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({
    queryKey: ["admin", "activities"],
  });
  queryClient.invalidateQueries({
    queryKey: ["admin", "activities", "stats"],
  });
}
