// src/hooks/admin/useAdminActivitiesManagement.ts
import { useQueryClient } from "@tanstack/react-query";
import { apiGet } from "../../lib/axios";
import { useAuthStore } from "../../store/auth.store";
import type {
  ActivityListItem,
  // ActivityDetail,
  ActivityStatistics,
  ActionTypeOption,
  ActivityFilters,
  ApiResponse,
  PaginatedResponse,
} from "../../types";
import {
  useAdminActivities,
  useActivityStatistics,
  useActivityActionTypes,
  invalidateActivitiesCache,
} from "./useAdminActivities";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ActivitiesManagementState {
  activities: PaginatedResponse<ActivityListItem> | undefined;
  statistics: ApiResponse<ActivityStatistics> | undefined;
  actionTypes: ActionTypeOption[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

interface SearchResult {
  total: number;
  results: ActivityListItem[];
}

// ─────────────────────────────────────────────────────────────
// Main hook
// ─────────────────────────────────────────────────────────────

/**
 * Comprehensive hook for admin activities management
 * Combines multiple queries and provides helper functions
 *
 * Usage:
 * ```ts
 * const {
 *   activities,
 *   statistics,
 *   actionTypes,
 *   isLoading,
 *   searchActivities,
 *   filterByActionType,
 *   refreshCache,
 * } = useAdminActivitiesManagement();
 * ```
 */
export function useAdminActivitiesManagement(filters?: ActivityFilters) {
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const queryClient = useQueryClient();

  // Main queries
  const activitiesQuery = useAdminActivities(filters, {
    enabled: isAdmin,
  });

  const statisticsQuery = useActivityStatistics({
    enabled: isAdmin,
  });

  const actionTypesQuery = useActivityActionTypes();

  // Derived state
  const isLoading =
    activitiesQuery.isLoading ||
    statisticsQuery.isLoading ||
    actionTypesQuery.isLoading;

  const isError =
    activitiesQuery.isError ||
    statisticsQuery.isError ||
    actionTypesQuery.isError;

  const error =
    activitiesQuery.error ||
    statisticsQuery.error ||
    actionTypesQuery.error ||
    null;

  const state: ActivitiesManagementState = {
    activities: activitiesQuery.data,
    statistics: statisticsQuery.data,
    actionTypes: actionTypesQuery.data,
    isLoading,
    isError,
    error: error as Error | null,
  };

  // ─────────────────────────────────────────────────────────────
  // Helper functions
  // ─────────────────────────────────────────────────────────────

  /**
   * Get summary statistics
   */
  const getSummary = () => {
    if (!statisticsQuery.data?.data) return null;

    const { total_activities, activities_last_7_days } =
      statisticsQuery.data.data;

    return {
      total: total_activities,
      lastSevenDays: activities_last_7_days,
      dailyAverage: activities_last_7_days / 7,
    };
  };

  /**
   * Get top action types
   */
  const getTopActionTypes = (limit: number = 5) => {
    if (!statisticsQuery.data?.data) return [];
    return statisticsQuery.data.data.top_action_types.slice(0, limit);
  };

  /**
   * Get top users
   */
  const getTopUsers = (limit: number = 5) => {
    if (!statisticsQuery.data?.data) return [];
    return statisticsQuery.data.data.top_users.slice(0, limit);
  };

  /**
   * Get action type display name
   */
  const getActionTypeDisplay = (actionType: string): string => {
    const found = actionTypesQuery.data?.find((at) => at.value === actionType);
    return found?.display || actionType;
  };

  /**
   * Get paginated activities
   */
  const getActivities = () => {
    return activitiesQuery.data?.results || [];
  };

  /**
   * Get pagination info
   */
  const getPagination = () => {
    if (!activitiesQuery.data) return null;

    return {
      count: activitiesQuery.data.count,
      next: activitiesQuery.data.next,
      previous: activitiesQuery.data.previous,
      hasNext: !!activitiesQuery.data.next,
      hasPrevious: !!activitiesQuery.data.previous,
    };
  };

  /**
   * Refresh activities cache
   */
  const refreshCache = () => {
    invalidateActivitiesCache(queryClient);
  };

  /**
   * Search activities by query
   */
  const searchActivities = async (query: string): Promise<SearchResult> => {
    try {
      const response = await apiGet<PaginatedResponse<ActivityListItem>>(
        "/activities/",
        {
          params: { search: query },
        },
      );

      return {
        total: response.count,
        results: response.results,
      };
    } catch (error) {
      console.error("Activity search failed:", error);
      return { total: 0, results: [] };
    }
  };

  /**
   * Get activity stats summary for dashboard card
   */
  const getDashboardSummary = () => {
    const summary = getSummary();
    const topActions = getTopActionTypes(3);

    return {
      summary,
      topActions: topActions.map((at) => ({
        ...at,
        display: getActionTypeDisplay(at.action_type),
      })),
    };
  };

  /**
   * Format activity for display
   */
  const formatActivity = (activity: ActivityListItem) => {
    return {
      ...activity,
      action_display: getActionTypeDisplay(activity.action_type),
      created_at_formatted: new Date(activity.created_at).toLocaleString(),
    };
  };

  /**
   * Format all activities
   */
  const getFormattedActivities = () => {
    return getActivities().map(formatActivity);
  };

  return {
    // Raw data
    ...state,

    // Queries for manual control
    activitiesQuery,
    statisticsQuery,
    actionTypesQuery,

    // Helper functions
    getSummary,
    getTopActionTypes,
    getTopUsers,
    getActionTypeDisplay,
    getActivities,
    getPagination,
    refreshCache,
    searchActivities,
    getDashboardSummary,
    formatActivity,
    getFormattedActivities,

    // Quick accessors
    totalActivities: statisticsQuery.data?.data?.total_activities || 0,
    lastSevenDaysActivities:
      statisticsQuery.data?.data?.activities_last_7_days || 0,
  };
}

// ─────────────────────────────────────────────────────────────
// Specialized hooks
// ─────────────────────────────────────────────────────────────

/**
 * Hook to get recent activities for dashboard
 */
export function useRecentActivities(limit: number = 10) {
  const hook = useAdminActivitiesManagement();
  const activities = hook.getFormattedActivities().slice(0, limit);

  return {
    ...hook,
    activities,
  };
}

/**
 * Hook to get activity statistics summary for dashboard
 */
export function useActivityDashboardSummary() {
  const hook = useAdminActivitiesManagement();

  return {
    ...hook,
    summary: hook.getDashboardSummary(),
  };
}
