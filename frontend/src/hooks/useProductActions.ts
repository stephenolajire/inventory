// src/hooks/useProductActions.ts

import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { QK } from "../lib/queryClient";
import { apiPatch, apiDelete, apiPost, getApiErrorMessage } from "../lib/axios";
import toast from "react-hot-toast";
import type { ApiResponse, ProductDetail } from "../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ToggleActivePayload {
  id:     string;
  active: boolean;
}

interface DeletePayload {
  id: string;
}

interface UpdateStockPayload {
  id:                string;
  quantity_in_stock: number;
}

type ToggleMutationResult = UseMutationResult<
  ApiResponse<ProductDetail>,
  Error,
  ToggleActivePayload
>;

type DeleteMutationResult = UseMutationResult<
  ApiResponse<{ success: boolean }>,
  Error,
  DeletePayload
>;

type UpdateStockMutationResult = UseMutationResult<
  ApiResponse<ProductDetail>,
  Error,
  UpdateStockPayload
>;

// ─────────────────────────────────────────────────────────────
// Toggle active
// ─────────────────────────────────────────────────────────────

export function useToggleProductActive(): ToggleMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ToggleActivePayload) =>
      payload.active
        ? apiPost<ApiResponse<ProductDetail>>(`/products/${payload.id}/activate/`)
        : apiPatch<ApiResponse<ProductDetail>>(`/products/${payload.id}/`, { is_active: false }),

    onSuccess: (_data, vars) => {
      toast.success(`Product ${vars.active ? "activated" : "deactivated"}.`);
      qc.invalidateQueries({ queryKey: QK.products.all() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Delete product
// ─────────────────────────────────────────────────────────────

export function useDeleteProduct(): DeleteMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeletePayload) =>
      apiDelete<ApiResponse<{ success: boolean }>>(`/products/${payload.id}/`),

    onSuccess: () => {
      toast.success("Product deleted.");
      qc.invalidateQueries({ queryKey: QK.products.all() });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Update stock
// ─────────────────────────────────────────────────────────────

export function useUpdateProductStock(): UpdateStockMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateStockPayload) =>
      apiPatch<ApiResponse<ProductDetail>>(
        `/products/${payload.id}/stock/`,
        { quantity_in_stock: payload.quantity_in_stock }
      ),

    onSuccess: (_data, vars) => {
      toast.success("Stock updated.");
      qc.invalidateQueries({ queryKey: QK.products.detail(vars.id) });
      qc.invalidateQueries({ queryKey: QK.products.list()           });
      qc.invalidateQueries({ queryKey: QK.products.lowStock()       });
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },
  });
}