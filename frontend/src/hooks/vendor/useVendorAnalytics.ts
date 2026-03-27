import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { QK, STALE } from "../../lib/queryClient";
import { apiGet } from "../../lib/axios";
import { useAuthStore } from "../../store/auth.store";
import type {
  RevenueSummary,
  MonthlyRevenue,
  DailyRevenue,
  YearlyRevenue,
  RushHour,
  TopProduct,
  PaymentMethodBreakdown,
  CategoryPerformance,
  ProfitMargin,
  InventoryHealth,
  ApiResponse,
} from "../../types";

interface MonthlyRevenueFilters {
  months?: number;
}

interface DailyRevenueFilters {
  month?: string;
}

interface RushHourFilters {
  days?: number;
}

interface TopProductFilters {
  limit?: number;
  from_date?: string;
  to_date?: string;
}

interface CategoryFilters {
  limit?: number;
  from_date?: string;
  to_date?: string;
}

interface MarginFilters {
  limit?: number;
  from_date?: string;
  to_date?: string;
}

const BASE = "/analytics";

const analyticsApi = {
  summary: (): Promise<ApiResponse<RevenueSummary>> =>
    apiGet<ApiResponse<RevenueSummary>>(`${BASE}/summary/`),

  monthly: (
    filters?: MonthlyRevenueFilters,
  ): Promise<ApiResponse<MonthlyRevenue[]>> => {
    const params: Record<string, unknown> = {};
    if (filters?.months) params.months = filters.months;
    return apiGet<ApiResponse<MonthlyRevenue[]>>(`${BASE}/revenue/monthly/`, {
      params,
    });
  },

  daily: (
    filters?: DailyRevenueFilters,
  ): Promise<ApiResponse<DailyRevenue[]>> => {
    const params: Record<string, unknown> = {};
    if (filters?.month) params.month = filters.month;
    return apiGet<ApiResponse<DailyRevenue[]>>(`${BASE}/revenue/daily/`, {
      params,
    });
  },

  yearly: (): Promise<ApiResponse<YearlyRevenue[]>> =>
    apiGet<ApiResponse<YearlyRevenue[]>>(`${BASE}/revenue/yearly/`),

  rushHours: (filters?: RushHourFilters): Promise<ApiResponse<RushHour[]>> => {
    const params: Record<string, unknown> = {};
    if (filters?.days) params.days = filters.days;
    return apiGet<ApiResponse<RushHour[]>>(`${BASE}/rush-hours/`, { params });
  },

  topProducts: (
    filters?: TopProductFilters,
  ): Promise<ApiResponse<TopProduct[]>> => {
    const params: Record<string, unknown> = {};
    if (filters?.limit) params.limit = filters.limit;
    if (filters?.from_date) params.from_date = filters.from_date;
    if (filters?.to_date) params.to_date = filters.to_date;
    return apiGet<ApiResponse<TopProduct[]>>(`${BASE}/top-products/`, {
      params,
    });
  },

  topProductsByRevenue: (
    filters?: TopProductFilters,
  ): Promise<ApiResponse<TopProduct[]>> => {
    const params: Record<string, unknown> = {};
    if (filters?.limit) params.limit = filters.limit;
    if (filters?.from_date) params.from_date = filters.from_date;
    if (filters?.to_date) params.to_date = filters.to_date;
    return apiGet<ApiResponse<TopProduct[]>>(`${BASE}/top-products/revenue/`, {
      params,
    });
  },

  worstProducts: (
    filters?: TopProductFilters,
  ): Promise<ApiResponse<TopProduct[]>> => {
    const params: Record<string, unknown> = {};
    if (filters?.limit) params.limit = filters.limit;
    if (filters?.from_date) params.from_date = filters.from_date;
    if (filters?.to_date) params.to_date = filters.to_date;
    return apiGet<ApiResponse<TopProduct[]>>(`${BASE}/worst-products/`, {
      params,
    });
  },

  paymentMethods: (filters?: {
    from_date?: string;
    to_date?: string;
  }): Promise<ApiResponse<PaymentMethodBreakdown[]>> => {
    const params: Record<string, unknown> = {};
    if (filters?.from_date) params.from_date = filters.from_date;
    if (filters?.to_date) params.to_date = filters.to_date;
    return apiGet<ApiResponse<PaymentMethodBreakdown[]>>(
      `${BASE}/payment-methods/`,
      { params },
    );
  },

  categories: (
    filters?: CategoryFilters,
  ): Promise<ApiResponse<CategoryPerformance[]>> => {
    const params: Record<string, unknown> = {};
    if (filters?.limit) params.limit = filters.limit;
    if (filters?.from_date) params.from_date = filters.from_date;
    if (filters?.to_date) params.to_date = filters.to_date;
    return apiGet<ApiResponse<CategoryPerformance[]>>(`${BASE}/categories/`, {
      params,
    });
  },

  margins: (filters?: MarginFilters): Promise<ApiResponse<ProfitMargin[]>> => {
    const params: Record<string, unknown> = {};
    if (filters?.limit) params.limit = filters.limit;
    if (filters?.from_date) params.from_date = filters.from_date;
    if (filters?.to_date) params.to_date = filters.to_date;
    return apiGet<ApiResponse<ProfitMargin[]>>(`${BASE}/margins/`, { params });
  },

  inventory: (): Promise<ApiResponse<InventoryHealth>> =>
    apiGet<ApiResponse<InventoryHealth>>(`${BASE}/inventory/`),
};

function useIsApproved(): boolean {
  return useAuthStore((s) => s.isApproved());
}

function useHasAnalytics(): boolean {
  return useAuthStore((s) => s.hasAnalytics());
}

export function useAnalyticsSummary(
  options?: Partial<UseQueryOptions<ApiResponse<RevenueSummary>>>,
): UseQueryResult<ApiResponse<RevenueSummary>> {
  const isApproved = useIsApproved();

  return useQuery({
    queryKey: QK.analytics.summary(),
    queryFn: analyticsApi.summary,
    staleTime: STALE.DEFAULT,
    enabled: isApproved,
    ...options,
  });
}

export function useMonthlyRevenue(
  filters?: MonthlyRevenueFilters,
  options?: Partial<UseQueryOptions<ApiResponse<MonthlyRevenue[]>>>,
): UseQueryResult<ApiResponse<MonthlyRevenue[]>> {
  const isApproved = useIsApproved();
  const hasAnalytics = useHasAnalytics();

  const stableFilters = useMemo(
    () => ({ months: filters?.months }),
    [filters?.months],
  );

  return useQuery({
    queryKey: QK.analytics.monthly(stableFilters),
    queryFn: () => analyticsApi.monthly(stableFilters),
    staleTime: STALE.DEFAULT,
    enabled: isApproved && hasAnalytics,
    ...options,
  });
}

export function useDailyRevenue(
  filters?: DailyRevenueFilters,
  options?: Partial<UseQueryOptions<ApiResponse<DailyRevenue[]>>>,
): UseQueryResult<ApiResponse<DailyRevenue[]>> {
  const isApproved = useIsApproved();
  const hasAnalytics = useHasAnalytics();

  const stableFilters = useMemo(
    () => ({ month: filters?.month }),
    [filters?.month],
  );

  return useQuery({
    queryKey: QK.analytics.daily(stableFilters),
    queryFn: () => analyticsApi.daily(stableFilters),
    staleTime: STALE.DEFAULT,
    enabled: isApproved && hasAnalytics,
    ...options,
  });
}

export function useYearlyRevenue(
  options?: Partial<UseQueryOptions<ApiResponse<YearlyRevenue[]>>>,
): UseQueryResult<ApiResponse<YearlyRevenue[]>> {
  const isApproved = useIsApproved();
  const hasAnalytics = useHasAnalytics();

  return useQuery({
    queryKey: QK.analytics.yearly(),
    queryFn: analyticsApi.yearly,
    staleTime: STALE.DEFAULT,
    enabled: isApproved && hasAnalytics,
    ...options,
  });
}

export function useRushHours(
  filters?: RushHourFilters,
  options?: Partial<UseQueryOptions<ApiResponse<RushHour[]>>>,
): UseQueryResult<ApiResponse<RushHour[]>> {
  const isApproved = useIsApproved();
  const hasAnalytics = useHasAnalytics();

  const stableFilters = useMemo(
    () => ({ days: filters?.days }),
    [filters?.days],
  );

  return useQuery({
    queryKey: QK.analytics.rushHours(stableFilters),
    queryFn: () => analyticsApi.rushHours(stableFilters),
    staleTime: STALE.DEFAULT,
    enabled: isApproved && hasAnalytics,
    ...options,
  });
}

export function useTopProducts(
  filters?: TopProductFilters,
  options?: Partial<UseQueryOptions<ApiResponse<TopProduct[]>>>,
): UseQueryResult<ApiResponse<TopProduct[]>> {
  const isApproved = useIsApproved();
  const hasAnalytics = useHasAnalytics();

  const stableFilters = useMemo(
    () => ({
      limit: filters?.limit,
      from_date: filters?.from_date,
      to_date: filters?.to_date,
    }),
    [filters?.limit, filters?.from_date, filters?.to_date],
  );

  return useQuery({
    queryKey: QK.analytics.topProducts(stableFilters),
    queryFn: () => analyticsApi.topProducts(stableFilters),
    staleTime: STALE.DEFAULT,
    enabled: isApproved && hasAnalytics,
    ...options,
  });
}

export function useTopProductsByRevenue(
  filters?: TopProductFilters,
  options?: Partial<UseQueryOptions<ApiResponse<TopProduct[]>>>,
): UseQueryResult<ApiResponse<TopProduct[]>> {
  const isApproved = useIsApproved();
  const hasAnalytics = useHasAnalytics();

  const stableFilters = useMemo(
    () => ({
      limit: filters?.limit,
      from_date: filters?.from_date,
      to_date: filters?.to_date,
    }),
    [filters?.limit, filters?.from_date, filters?.to_date],
  );

  return useQuery({
    queryKey: QK.analytics.topRevenue(stableFilters),
    queryFn: () => analyticsApi.topProductsByRevenue(stableFilters),
    staleTime: STALE.DEFAULT,
    enabled: isApproved && hasAnalytics,
    ...options,
  });
}

export function useWorstProducts(
  filters?: TopProductFilters,
  options?: Partial<UseQueryOptions<ApiResponse<TopProduct[]>>>,
): UseQueryResult<ApiResponse<TopProduct[]>> {
  const isApproved = useIsApproved();
  const hasAnalytics = useHasAnalytics();

  const stableFilters = useMemo(
    () => ({
      limit: filters?.limit,
      from_date: filters?.from_date,
      to_date: filters?.to_date,
    }),
    [filters?.limit, filters?.from_date, filters?.to_date],
  );

  return useQuery({
    queryKey: QK.analytics.worstProducts(stableFilters),
    queryFn: () => analyticsApi.worstProducts(stableFilters),
    staleTime: STALE.DEFAULT,
    enabled: isApproved && hasAnalytics,
    ...options,
  });
}

export function usePaymentMethodBreakdown(
  filters?: { from_date?: string; to_date?: string },
  options?: Partial<UseQueryOptions<ApiResponse<PaymentMethodBreakdown[]>>>,
): UseQueryResult<ApiResponse<PaymentMethodBreakdown[]>> {
  const isApproved = useIsApproved();
  const hasAnalytics = useHasAnalytics();

  const stableFilters = useMemo(
    () => ({ from_date: filters?.from_date, to_date: filters?.to_date }),
    [filters?.from_date, filters?.to_date],
  );

  return useQuery({
    queryKey: QK.analytics.paymentMethods(stableFilters),
    queryFn: () => analyticsApi.paymentMethods(stableFilters),
    staleTime: STALE.DEFAULT,
    enabled: isApproved && hasAnalytics,
    ...options,
  });
}

export function useCategoryPerformance(
  filters?: CategoryFilters,
  options?: Partial<UseQueryOptions<ApiResponse<CategoryPerformance[]>>>,
): UseQueryResult<ApiResponse<CategoryPerformance[]>> {
  const isApproved = useIsApproved();
  const hasAnalytics = useHasAnalytics();

  const stableFilters = useMemo(
    () => ({
      limit: filters?.limit,
      from_date: filters?.from_date,
      to_date: filters?.to_date,
    }),
    [filters?.limit, filters?.from_date, filters?.to_date],
  );

  return useQuery({
    queryKey: QK.analytics.categories(stableFilters),
    queryFn: () => analyticsApi.categories(stableFilters),
    staleTime: STALE.DEFAULT,
    enabled: isApproved && hasAnalytics,
    ...options,
  });
}

export function useProfitMargins(
  filters?: MarginFilters,
  options?: Partial<UseQueryOptions<ApiResponse<ProfitMargin[]>>>,
): UseQueryResult<ApiResponse<ProfitMargin[]>> {
  const isApproved = useIsApproved();
  const hasAnalytics = useHasAnalytics();

  const stableFilters = useMemo(
    () => ({
      limit: filters?.limit,
      from_date: filters?.from_date,
      to_date: filters?.to_date,
    }),
    [filters?.limit, filters?.from_date, filters?.to_date],
  );

  return useQuery({
    queryKey: QK.analytics.margins(stableFilters),
    queryFn: () => analyticsApi.margins(stableFilters),
    staleTime: STALE.DEFAULT,
    enabled: isApproved && hasAnalytics,
    ...options,
  });
}

export function useInventoryHealth(
  options?: Partial<UseQueryOptions<ApiResponse<InventoryHealth>>>,
): UseQueryResult<ApiResponse<InventoryHealth>> {
  const isApproved = useIsApproved();
  const hasAnalytics = useHasAnalytics();

  return useQuery({
    queryKey: QK.analytics.inventory(),
    queryFn: analyticsApi.inventory,
    staleTime: STALE.DEFAULT,
    enabled: isApproved && hasAnalytics,
    ...options,
  });
}

interface AnalyticsDashboardParams {
  months?: number;
  month?: string;
  days?: number;
  limit?: number;
  from_date?: string;
  to_date?: string;
}

interface VendorAnalyticsHook {
  summary: UseQueryResult<ApiResponse<RevenueSummary>>;
  monthly: UseQueryResult<ApiResponse<MonthlyRevenue[]>>;
  daily: UseQueryResult<ApiResponse<DailyRevenue[]>>;
  yearly: UseQueryResult<ApiResponse<YearlyRevenue[]>>;
  rushHours: UseQueryResult<ApiResponse<RushHour[]>>;
  topProducts: UseQueryResult<ApiResponse<TopProduct[]>>;
  topByRevenue: UseQueryResult<ApiResponse<TopProduct[]>>;
  worstProducts: UseQueryResult<ApiResponse<TopProduct[]>>;
  paymentMethods: UseQueryResult<ApiResponse<PaymentMethodBreakdown[]>>;
  categories: UseQueryResult<ApiResponse<CategoryPerformance[]>>;
  margins: UseQueryResult<ApiResponse<ProfitMargin[]>>;
  inventory: UseQueryResult<ApiResponse<InventoryHealth>>;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  hasAnalytics: boolean;
}

export function useVendorAnalytics(
  params?: AnalyticsDashboardParams,
): VendorAnalyticsHook {
  const hasAnalytics = useHasAnalytics();

  const monthlyFilters = useMemo(
    () => ({ months: params?.months }),
    [params?.months],
  );
  const dailyFilters = useMemo(
    () => ({ month: params?.month }),
    [params?.month],
  );
  const rushFilters = useMemo(() => ({ days: params?.days }), [params?.days]);
  const rangeFilters = useMemo(
    () => ({
      limit: params?.limit,
      from_date: params?.from_date,
      to_date: params?.to_date,
    }),
    [params?.limit, params?.from_date, params?.to_date],
  );
  const dateOnlyFilters = useMemo(
    () => ({ from_date: params?.from_date, to_date: params?.to_date }),
    [params?.from_date, params?.to_date],
  );

  const summary = useAnalyticsSummary();
  const monthly = useMonthlyRevenue(monthlyFilters);
  const daily = useDailyRevenue(dailyFilters);
  const yearly = useYearlyRevenue();
  const rushHours = useRushHours(rushFilters);
  const topProducts = useTopProducts(rangeFilters);
  const topByRevenue = useTopProductsByRevenue(rangeFilters);
  const worstProducts = useWorstProducts(rangeFilters);
  const paymentMethods = usePaymentMethodBreakdown(dateOnlyFilters);
  const categories = useCategoryPerformance(rangeFilters);
  const margins = useProfitMargins(rangeFilters);
  const inventory = useInventoryHealth();

  const isLoading =
    summary.isLoading ||
    monthly.isLoading ||
    daily.isLoading ||
    yearly.isLoading ||
    rushHours.isLoading ||
    topProducts.isLoading ||
    topByRevenue.isLoading ||
    worstProducts.isLoading ||
    paymentMethods.isLoading ||
    categories.isLoading ||
    margins.isLoading ||
    inventory.isLoading;

  const isError =
    summary.isError ||
    monthly.isError ||
    daily.isError ||
    yearly.isError ||
    rushHours.isError ||
    topProducts.isError ||
    topByRevenue.isError ||
    worstProducts.isError ||
    paymentMethods.isError ||
    categories.isError ||
    margins.isError ||
    inventory.isError;

  const isFetching =
    summary.isFetching ||
    monthly.isFetching ||
    daily.isFetching ||
    yearly.isFetching ||
    rushHours.isFetching ||
    topProducts.isFetching ||
    topByRevenue.isFetching ||
    worstProducts.isFetching ||
    paymentMethods.isFetching ||
    categories.isFetching ||
    margins.isFetching ||
    inventory.isFetching;

  return {
    summary,
    monthly,
    daily,
    yearly,
    rushHours,
    topProducts,
    topByRevenue,
    worstProducts,
    paymentMethods,
    categories,
    margins,
    inventory,
    isLoading,
    isError,
    isFetching,
    hasAnalytics,
  };
}
