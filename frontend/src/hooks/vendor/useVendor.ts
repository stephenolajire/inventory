// src/hooks/useVendor.ts

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
import { apiGet, apiPatch, apiUpload, getApiErrorMessage } from "../../lib/axios";
import { useAuthStore } from "../../store/auth.store";
import toast from "react-hot-toast";
import type {
  VendorProfile,
  VendorProfileUpdateRequest,
  ScannerVendorView,
  ActiveSubscription,
  ApiResponse,
} from "../../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface UploadLogoPayload {
  file:        File;
  onProgress?: (pct: number) => void;
}

type UpdateProfileMutationResult = UseMutationResult<
  ApiResponse<VendorProfile>,
  Error,
  VendorProfileUpdateRequest
>;

type UploadLogoMutationResult = UseMutationResult<
  ApiResponse<VendorProfile>,
  Error,
  UploadLogoPayload
>;

type UpdateProfileMutationOptions = UseMutationOptions<
  ApiResponse<VendorProfile>,
  Error,
  VendorProfileUpdateRequest
>;

type UploadLogoMutationOptions = UseMutationOptions<
  ApiResponse<VendorProfile>,
  Error,
  UploadLogoPayload
>;

// ─────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────

const BASE = "/vendors";

const vendorApi = {

  profile: (): Promise<ApiResponse<VendorProfile>> =>
    apiGet<ApiResponse<VendorProfile>>(`${BASE}/me/profile`),

  updateProfile: (
    data: VendorProfileUpdateRequest
  ): Promise<ApiResponse<VendorProfile>> =>
    apiPatch<ApiResponse<VendorProfile>>(`${BASE}/me/profile/update/`, data),

  uploadLogo: (
    file:        File,
    onProgress?: (pct: number) => void
  ): Promise<ApiResponse<VendorProfile>> => {
    const formData = new FormData();
    formData.append("business_logo", file);
    return apiUpload<ApiResponse<VendorProfile>>(
      `${BASE}/me/profile/logo/`,
      formData,
      onProgress
    );
  },

  scanner: (): Promise<ApiResponse<ScannerVendorView>> =>
    apiGet<ApiResponse<ScannerVendorView>>(`${BASE}/me/profile/scanner/`),

  subscription: (): Promise<ApiResponse<ActiveSubscription>> =>
    apiGet<ApiResponse<ActiveSubscription>>(`${BASE}/me/profile/subscription/`),
};

// ─────────────────────────────────────────────────────────────
// Guard
// ─────────────────────────────────────────────────────────────

function useIsVendor(): boolean {
  return useAuthStore((s) => s.isVendor());
}


// ─────────────────────────────────────────────────────────────
// Vendor profile
// ─────────────────────────────────────────────────────────────

export function useVendorProfile(
  options?: Partial<UseQueryOptions<ApiResponse<VendorProfile>>>
): UseQueryResult<ApiResponse<VendorProfile>> {
  const isVendor = useIsVendor();

  return useQuery({
    queryKey:  QK.vendorProfile(),
    queryFn:   vendorApi.profile,
    staleTime: STALE.DEFAULT,
    enabled:   isVendor,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Update profile
// ─────────────────────────────────────────────────────────────

export function useUpdateVendorProfile(
  options?: UpdateProfileMutationOptions
): UpdateProfileMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: VendorProfileUpdateRequest) =>
      vendorApi.updateProfile(data),

    onSuccess: (res) => {
      toast.success("Profile updated.");
      qc.setQueryData(QK.vendorProfile(), res);
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Upload logo
// ─────────────────────────────────────────────────────────────

export function useUploadVendorLogo(
  options?: UploadLogoMutationOptions
): UploadLogoMutationResult {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UploadLogoPayload) =>
      vendorApi.uploadLogo(payload.file, payload.onProgress),

    onSuccess: (res) => {
      toast.success("Logo uploaded.");
      qc.setQueryData(QK.vendorProfile(), res);
    },

    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err));
    },

    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Vendor scanner
// ─────────────────────────────────────────────────────────────

export function useVendorScanner(
  options?: Partial<UseQueryOptions<ApiResponse<ScannerVendorView>>>
): UseQueryResult<ApiResponse<ScannerVendorView>> {
  const isVendor = useIsVendor();

  return useQuery({
    queryKey:  QK.vendorScanner(),
    queryFn:   vendorApi.scanner,
    staleTime: STALE.STATIC,
    enabled:   isVendor,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Vendor subscription
// ─────────────────────────────────────────────────────────────

export function useVendorSubscription(
  options?: Partial<UseQueryOptions<ApiResponse<ActiveSubscription>>>
): UseQueryResult<ApiResponse<ActiveSubscription>> {
  const isVendor = useIsVendor();

  return useQuery({
    queryKey:  QK.vendorSubscription(),
    queryFn:   vendorApi.subscription,
    staleTime: STALE.DEFAULT,
    enabled:   isVendor,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Composite hook — vendor profile page
// ─────────────────────────────────────────────────────────────

interface VendorHook {
  profile:      UseQueryResult<ApiResponse<VendorProfile>>;
  scanner:      UseQueryResult<ApiResponse<ScannerVendorView>>;
  subscription: UseQueryResult<ApiResponse<ActiveSubscription>>;
  update:       UpdateProfileMutationResult;
  uploadLogo:   UploadLogoMutationResult;
  isLoading:    boolean;
  isError:      boolean;
  isFetching:   boolean;
}

export function useVendor(): VendorHook {
  const profile      = useVendorProfile();
  const scanner      = useVendorScanner();
  const subscription = useVendorSubscription();
  const update       = useUpdateVendorProfile();
  const uploadLogo   = useUploadVendorLogo();

  return {
    profile,
    scanner,
    subscription,
    update,
    uploadLogo,
    isLoading:  profile.isLoading  || scanner.isLoading  || subscription.isLoading,
    isError:    profile.isError    || scanner.isError    || subscription.isError,
    isFetching: profile.isFetching || scanner.isFetching || subscription.isFetching,
  };
}