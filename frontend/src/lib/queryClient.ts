import {
  QueryClient,
  QueryCache,
  MutationCache,
  type DefaultOptions,
} from "@tanstack/react-query";
import { getApiErrorMessage } from "./axios";
import { toast } from "react-toastify";

const STALE_TIME_DEFAULT = 1000 * 60 * 5;
const STALE_TIME_STATIC = 1000 * 60 * 60;
const STALE_TIME_REALTIME = 1000 * 30;
const STALE_TIME_NEVER = Infinity;
const GC_TIME_DEFAULT = 1000 * 60 * 10;
const RETRY_COUNT = 1;
const RETRY_DELAY_MS = 1000;

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= RETRY_COUNT) return false;
  const status = (error as any)?.response?.status as number | undefined;
  if (status && status >= 400 && status < 500) return false;
  return true;
}

const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: STALE_TIME_DEFAULT,
    gcTime: GC_TIME_DEFAULT,
    retry: shouldRetry,
    retryDelay: RETRY_DELAY_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    refetchIntervalInBackground: false,
  },
  mutations: {
    retry: false,
  },
};

function handleGlobalError(error: unknown, context?: string) {
  const message = getApiErrorMessage(error);
  const status = (error as any)?.response?.status as number | undefined;
  if (status === 401) return;
  if (status === 404 && !context) return;
  toast.error(message);
}

export const queryClient = new QueryClient({
  defaultOptions,

  queryCache: new QueryCache({
    onError: (error: any) => {
      handleGlobalError(error);
    },
  }),

  mutationCache: new MutationCache({
    onError: (error: any, _variable: any, _context: any, mutation: any) => {
      if (!mutation.options.onError) {
        handleGlobalError(error, "mutation");
      }
    },
    onSuccess: (_data: any, _variables: any, _context: any, mutation: any) => {
      const invalidates = (mutation.options.meta as any)?.invalidates as
        | string[][]
        | undefined;

      if (invalidates) {
        invalidates.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
    },
  }),
});

export const STALE = {
  DEFAULT: STALE_TIME_DEFAULT,
  STATIC: STALE_TIME_STATIC,
  REALTIME: STALE_TIME_REALTIME,
  NEVER: STALE_TIME_NEVER,
} as const;

export const QK = {
  me: () => ["me"] as const,

  vendorProfile: () => ["vendor", "profile"] as const,
  vendorScanner: () => ["vendor", "scanner"] as const,
  vendorSubscription: () => ["vendor", "subscription"] as const,

  products: {
    all: () => ["products"] as const,
    list: (f?: object) => ["products", "list", f] as const,
    detail: (id: string) => ["products", "detail", id] as const,
    lowStock: () => ["products", "low-stock"] as const,
  },

  categories: {
    all: () => ["categories"] as const,
    list: () => ["categories", "list"] as const,
  },

  carts: {
    all: () => ["carts"] as const,
    open: () => ["carts", "open"] as const,
    detail: (id: string) => ["carts", "detail", id] as const,
    history: (f?: object) => ["carts", "history", f] as const,
  },

  sales: {
    all: () => ["sales"] as const,
    list: (f?: object) => ["sales", "list", f] as const,
    detail: (id: string) => ["sales", "detail", id] as const,
    receipt: (cartId: string) => ["sales", "receipt", cartId] as const,
    summary: () => ["sales", "summary"] as const,
    byProduct: (f?: object) => ["sales", "by-product", f] as const,
    byMethod: (f?: object) => ["sales", "by-method", f] as const,
  },

  plans: () => ["plans"] as const,
  subscription: () => ["subscription", "me"] as const,

  analytics: {
    summary: () => ["analytics", "summary"] as const,
    monthly: (f?: object) => ["analytics", "monthly", f] as const,
    daily: (f?: object) => ["analytics", "daily", f] as const,
    yearly: () => ["analytics", "yearly"] as const,
    rushHours: (f?: object) => ["analytics", "rush-hours", f] as const,
    topProducts: (f?: object) => ["analytics", "top-products", f] as const,
    topRevenue: (f?: object) => ["analytics", "top-revenue", f] as const,
    worstProducts: (f?: object) => ["analytics", "worst", f] as const,
    paymentMethods: (f?: object) => ["analytics", "payments", f] as const,
    categories: (f?: object) => ["analytics", "categories", f] as const,
    margins: (f?: object) => ["analytics", "margins", f] as const,
    inventory: () => ["analytics", "inventory"] as const,
  },

  adminAnalytics: {
    summary: () => ["admin-analytics", "summary"] as const,
    monthly: (f?: object) => ["admin-analytics", "monthly", f] as const,
    topVendors: (f?: object) => ["admin-analytics", "top-vendors", f] as const,
    subscriptions: () => ["admin-analytics", "subscriptions"] as const,
    registrations: (f?: object) =>
      ["admin-analytics", "registrations", f] as const,
  },

  reports: {
    all: () => ["reports"] as const,
    list: (f?: object) => ["reports", "list", f] as const,
    detail: (id: string) => ["reports", "detail", id] as const,
  },

  paypalOrders: () => ["paypal", "orders"] as const,
  paypalSubscription: () => ["paypal", "subscription"] as const,

  notifications: {
    all: () => ["notifications"] as const,
    list: (f?: object) => ["notifications", "list", f] as const,
    detail: (id: string) => ["notifications", "detail", id] as const,
    unreadCount: () => ["notifications", "unread-count"] as const,
    preferences: () => ["notifications", "preferences"] as const,
  },

  scanners: {
    all: () => ["scanners"] as const,
    list: (f?: object) => ["scanners", "list", f] as const,
    detail: (id: string) => ["scanners", "detail", id] as const,
    available: () => ["scanners", "available"] as const,
    stats: () => ["scanners", "stats"] as const,
  },

  geography: {
    countries: () => ["geography", "countries"] as const,
    states: (countryId?: string) => ["geography", "states", countryId] as const,
    lgas: (stateId?: string) => ["geography", "lgas", stateId] as const,
  },

  admin: {
    users: (f?: object) => ["admin", "users", f] as const,
    user: (id: string) => ["admin", "user", id] as const,
    vendors: (f?: object) => ["admin", "vendors", f] as const,
    vendor: (id: string) => ["admin", "vendor", id] as const,
    pendingVendors: () => ["admin", "vendors", "pending"] as const,
    sales: (f?: object) => ["admin", "sales", f] as const,
    subscriptions: (f?: object) => ["admin", "subscriptions", f] as const,
    subscription: (id: string) => ["admin", "subscription", id] as const,
    subscriptionStats: () => ["admin", "subscription-stats"] as const,
    reports: (f?: object) => ["admin", "reports", f] as const,
    failedReports: () => ["admin", "reports", "failed"] as const,
    notifications: () => ["admin", "notifications"] as const,
    notificationStats: () => ["admin", "notification-stats"] as const,
    activities: (f?: object) => ["admin", "activities", f] as const,
    activity: (id: string) => ["admin", "activity", id] as const,
    activityStats: () => ["admin", "activities", "stats"] as const,
    actionTypes: () => ["admin", "action-types"] as const,
    // Inside QK.admin:
    vendorAnalytics: (id: string) =>
      ["admin", "vendors", id, "analytics"] as const,
  },
} as const;
