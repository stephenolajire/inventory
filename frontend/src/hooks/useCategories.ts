// src/hooks/useCategories.ts

import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { QK, STALE } from "../lib/queryClient";
import { apiGet } from "../lib/axios";
import { useAuthStore } from "../store/auth.store";
import type { Category, PaginatedResponse } from "../types";

export function useCategories(
  options?: Partial<UseQueryOptions<PaginatedResponse<Category>>>,
): UseQueryResult<PaginatedResponse<Category>> {
  const isApproved = useAuthStore((s) => s.isApproved());

  return useQuery({
    queryKey: QK.categories.list(),
    queryFn: () => apiGet<PaginatedResponse<Category>>("/products/categories/"),
    staleTime: STALE.STATIC,
    enabled: isApproved,
    ...options,
  });
}
