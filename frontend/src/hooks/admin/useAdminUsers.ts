// src/hooks/admin/useAdminUsers.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { QK, STALE } from "../../lib/queryClient";
import { apiGet, apiPost, apiPatch, getApiErrorMessage } from "../../lib/axios";
import { useAuthStore } from "../../store/auth.store";
import toast from "react-hot-toast";
import type {
  User,
  UserListItem,
  UserDetail,
  UserRole,
  UserStatus,
  ApiResponse,
  PaginatedResponse,
} from "../../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AdminUserFilters {
  role?:   UserRole;
  status?: UserStatus;
  search?: string;
  page?:   number;
}

interface UpdateStatusPayload {
  user_id: string;
  status:  UserStatus;
}

interface SuspendPayload {
  user_id: string;
}

interface ReinstatePayload {
  user_id: string;
}

type UpdateStatusMutationResult = UseMutationResult<
  ApiResponse<User>,
  Error,
  UpdateStatusPayload
>;

type SuspendMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean; message: string }>,
  Error,
  SuspendPayload
>;

type ReinstateMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean; message: string }>,
  Error,
  ReinstatePayload
>;

type UpdateStatusMutationOptions = UseMutationOptions<
  ApiResponse<User>,
  Error,
  UpdateStatusPayload
>;

type SuspendMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean; message: string }>,
  Error,
  SuspendPayload
>;

type ReinstateMutationOptions = UseMutationOptions<
  ApiResponse<{ success: boolean; message: string }>,
  Error,
  ReinstatePayload
>;

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

const BASE = "/auth/admin/users";

const adminUsersApi = {

  list: (
    filters?: AdminUserFilters
  ): Promise<PaginatedResponse<UserListItem>> => {
    const params: Record<string, unknown> = {};
    if (filters?.role)   params.role   = filters.role;
    if (filters?.status) params.status = filters.status;
    if (filters?.search) params.search = filters.search;
    if (filters?.page)   params.page   = filters.page;
    return apiGet<PaginatedResponse<UserListItem>>(
      `${BASE}/`,
      { params }
    );
  },

  detail: (id: string): Promise<ApiResponse<UserDetail>> =>
    apiGet<ApiResponse<UserDetail>>(`${BASE}/${id}/`),

  updateStatus: (
    payload: UpdateStatusPayload
  ): Promise<ApiResponse<User>> =>
    apiPatch<ApiResponse<User>>(
      `${BASE}/${payload.user_id}/status/`,
      { status: payload.status }
    ),

  suspend: (
    payload: SuspendPayload
  ): Promise<ApiResponse<{ success: boolean; message: string }>> =>
    apiPost<ApiResponse<{ success: boolean; message: string }>>(
      `${BASE}/${payload.user_id}/suspend/`
    ),

  reinstate: (
    payload: ReinstatePayload
  ): Promise<ApiResponse<{ success: boolean; message: string }>> =>
    apiPost<ApiResponse<{ success: boolean; message: string }>>(
      `${BASE}/${payload.user_id}/reinstate/`
    ),
};

// ─────────────────────────────────────────────────────────────
// Guard
// ─────────────────────────────────────────────────────────────

function useIsAdmin(): boolean {
  return useAuthStore((s) => s.isAdmin());
}

// ─────────────────────────────────────────────────────────────
// List users
// ─────────────────────────────────────────────────────────────

export function useAdminUsers(
  filters?: AdminUserFilters,
  options?: Partial<UseQueryOptions<PaginatedResponse<UserListItem>>>
): UseQueryResult<PaginatedResponse<UserListItem>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey:  QK.admin.users(filters as object),
    queryFn:   () => adminUsersApi.list(filters),
    staleTime: STALE.DEFAULT,
    enabled:   isAdmin,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Single user detail
// ─────────────────────────────────────────────────────────────

export function useAdminUserDetail(
  id:       string,
  options?: Partial<UseQueryOptions<ApiResponse<UserDetail>>>
): UseQueryResult<ApiResponse<UserDetail>> {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey:  QK.admin.user(id),
    queryFn:   () => adminUsersApi.detail(id),
    staleTime: STALE.DEFAULT,
    enabled:   isAdmin && !!id,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Update status
// ─────────────────────────────────────────────────────────────

export function useAdminUpdateUserStatus(
  options?: UpdateStatusMutationOptions
): UpdateStatusMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateStatusPayload) =>
      adminUsersApi.updateStatus(payload),

    onSuccess: (_data, vars) => {
      toast.success("User status updated.");
      qc.invalidateQueries({ queryKey: QK.admin.user(vars.user_id) });
      qc.invalidateQueries({ queryKey: QK.admin.users() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Suspend user
// ─────────────────────────────────────────────────────────────

export function useAdminSuspendUser(
  options?: SuspendMutationOptions
): SuspendMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: SuspendPayload) =>
      adminUsersApi.suspend(payload),

    onSuccess: (_data, vars) => {
      toast.success("User suspended.");
      qc.invalidateQueries({ queryKey: QK.admin.user(vars.user_id) });
      qc.invalidateQueries({ queryKey: QK.admin.users() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Reinstate user
// ─────────────────────────────────────────────────────────────

export function useAdminReinstateUser(
  options?: ReinstateMutationOptions
): ReinstateMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReinstatePayload) =>
      adminUsersApi.reinstate(payload),

    onSuccess: (_data, vars) => {
      toast.success("User reinstated.");
      qc.invalidateQueries({ queryKey: QK.admin.user(vars.user_id) });
      qc.invalidateQueries({ queryKey: QK.admin.users() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Composite hook — admin users page
// ─────────────────────────────────────────────────────────────

interface AdminUsersDashboard {
  users:        UseQueryResult<PaginatedResponse<UserListItem>>;
  updateStatus: UpdateStatusMutationResult;
  suspend:      SuspendMutationResult;
  reinstate:    ReinstateMutationResult;
  isLoading:    boolean;
  isError:      boolean;
  isFetching:   boolean;
}

export function useAdminUsersDashboard(
  filters?: AdminUserFilters
): AdminUsersDashboard {
  const users        = useAdminUsers(filters);
  const updateStatus = useAdminUpdateUserStatus();
  const suspend      = useAdminSuspendUser();
  const reinstate    = useAdminReinstateUser();

  return {
    users,
    updateStatus,
    suspend,
    reinstate,
    isLoading:  users.isLoading,
    isError:    users.isError,
    isFetching: users.isFetching,
  };
}