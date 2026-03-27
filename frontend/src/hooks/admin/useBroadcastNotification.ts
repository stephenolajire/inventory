// src/hooks/admin/useBroadcastNotification.ts

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { QK } from "../../lib/queryClient";
import { apiPost, getApiErrorMessage } from "../../lib/axios";
// import { useAuthStore } from "../../store/auth.store";
import toast from "react-hot-toast";
import type {
  ApiResponse,
  AdminBroadcastRequest,
  NotificationChannel,
} from "../../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface BroadcastSinglePayload {
  vendor_id:   string;
  title:       string;
  message:     string;
  channel:     NotificationChannel;
  action_url?: string;
}

interface BroadcastAllPayload {
  title:       string;
  message:     string;
  channel:     NotificationChannel;
  action_url?: string;
}

interface BroadcastResponse {
  success: boolean;
  message: string;
  sent_to: number;
}

type BroadcastSingleMutationResult = UseMutationResult<
  ApiResponse<BroadcastResponse>,
  Error,
  BroadcastSinglePayload
>;

type BroadcastAllMutationResult = UseMutationResult<
  ApiResponse<BroadcastResponse>,
  Error,
  BroadcastAllPayload
>;

type BroadcastSingleMutationOptions = UseMutationOptions<
  ApiResponse<BroadcastResponse>,
  Error,
  BroadcastSinglePayload
>;

type BroadcastAllMutationOptions = UseMutationOptions<
  ApiResponse<BroadcastResponse>,
  Error,
  BroadcastAllPayload
>;

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

const BASE = "/notifications/admin";

const broadcastApi = {

  toVendor: (
    payload: BroadcastSinglePayload
  ): Promise<ApiResponse<BroadcastResponse>> => {
    const body: AdminBroadcastRequest = {
      title:      payload.title,
      message:    payload.message,
      channel:    payload.channel,
      vendor_id:  payload.vendor_id,
      action_url: payload.action_url,
    };
    return apiPost<ApiResponse<BroadcastResponse>>(
      `${BASE}/broadcast/`,
      body
    );
  },

  toAll: (
    payload: BroadcastAllPayload
  ): Promise<ApiResponse<BroadcastResponse>> => {
    const body: AdminBroadcastRequest = {
      title:      payload.title,
      message:    payload.message,
      channel:    payload.channel,
      action_url: payload.action_url,
    };
    return apiPost<ApiResponse<BroadcastResponse>>(
      `${BASE}/broadcast/`,
      body
    );
  },
};


export function useBroadcastToVendor(
  options?: BroadcastSingleMutationOptions
): BroadcastSingleMutationResult {
  const qc      = useQueryClient();
//   const isAdmin = useIsAdmin();

  return useMutation({
    mutationFn: (payload: BroadcastSinglePayload) =>
      broadcastApi.toVendor(payload),

    onSuccess: (data) => {
      const sent = data?.data?.sent_to ?? 0;
      toast.success(`Notification sent to vendor (${sent} delivered).`);
      qc.invalidateQueries({
        queryKey: QK.admin.notifications(),
      });
      qc.invalidateQueries({
        queryKey: QK.admin.notificationStats(),
      });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Broadcast to all vendors
// ─────────────────────────────────────────────────────────────

export function useBroadcastToAll(
  options?: BroadcastAllMutationOptions
): BroadcastAllMutationResult {
  const qc      = useQueryClient();
//   const isAdmin = useIsAdmin();

  return useMutation({
    mutationFn: (payload: BroadcastAllPayload) =>
      broadcastApi.toAll(payload),

    onSuccess: (data) => {
      const sent = data?.data?.sent_to ?? 0;
      toast.success(`Broadcast sent to all vendors (${sent} delivered).`);
      qc.invalidateQueries({
        queryKey: QK.admin.notifications(),
      });
      qc.invalidateQueries({
        queryKey: QK.admin.notificationStats(),
      });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Composite hook — broadcast panel
// Exposes both mutations together for the broadcast form
// that lets the admin choose single vendor or all vendors.
// ─────────────────────────────────────────────────────────────

interface BroadcastPanel {
  toVendor:   BroadcastSingleMutationResult;
  toAll:      BroadcastAllMutationResult;
  isPending:  boolean;
}

export function useBroadcastPanel(): BroadcastPanel {
  const toVendor = useBroadcastToVendor();
  const toAll    = useBroadcastToAll();

  return {
    toVendor,
    toAll,
    isPending: toVendor.isPending || toAll.isPending,
  };
}