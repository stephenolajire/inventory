
export function formatCurrency(
  value: number | string,
  withSymbol: boolean = true,
  decimals: number = 2,
): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return withSymbol ? "£0.00" : "0.00";

  const formatted = num.toLocaleString("en-NG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return withSymbol ? `£${formatted}` : formatted;
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";


export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}


export function formatCurrencyCompact(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "£0";

  if (num >= 1_000_000_000) return `£${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `£${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `£${(num / 1_000).toFixed(1)}K`;
  return `£${num}`;
}


export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[£,\s]/g, "");
  return parseFloat(cleaned) || 0;
}


export function formatDate(
  value: string | Date | null | undefined,
  format: "default" | "short" | "long" | "month" | "iso" = "default",
): string {
  if (!value) return "—";

  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "—";

  switch (format) {
    case "short":
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });

    case "long":
      return date.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

    case "month":
      return date.toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      });

    case "iso":
      return date.toISOString().split("T")[0];

    default:
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
  }
}


export function formatTime(
  value: string | Date | null | undefined,
  withSeconds: boolean = false,
): string {
  if (!value) return "—";

  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
    hour12: true,
  });
}


export function formatDateTime(
  value: string | Date | null | undefined,
): string {
  if (!value) return "—";

  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "—";

  return `${formatDate(value)} at ${formatTime(value)}`;
}


export function timeAgo(value: string | Date | null | undefined): string {
  if (!value) return "—";

  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "—";

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSecs < 10) return "just now";
  if (diffSecs < 60) return `${diffSecs} seconds ago`;
  if (diffMins < 60)
    return diffMins === 1 ? "1 minute ago" : `${diffMins} minutes ago`;
  if (diffHrs < 24)
    return diffHrs === 1 ? "1 hour ago" : `${diffHrs} hours ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}


export function daysUntil(value: string | Date | null | undefined): number {
  if (!value) return 0;

  const date = typeof value === "string" ? new Date(value) : value;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = date.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}


export function formatNumber(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-NG");
}


export function formatNumberCompact(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}


export function formatPercent(
  value: number,
  withSign: boolean = true,
  decimals: number = 1,
): string {
  const fixed = Math.abs(value).toFixed(decimals);
  if (!withSign) return `${fixed}%`;
  return value >= 0 ? `+${fixed}%` : `-${fixed}%`;
}


export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}


export function truncate(value: string, maxLength: number): string {
  if (!value) return "";
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength - 1) + "…";
}


export function capitalize(value: string): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function toTitleCase(value: string): string {
  if (!value) return "";
  return value
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
}


export function getInitials(name: string): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}


export function emailToName(email: string): string {
  return email?.split("@")[0] ?? "";
}


export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}


export function maskEmail(email: string): string {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}****@${domain}`;
}


export function maskPhone(phone: string): string {
  if (!phone || phone.length < 8) return phone;
  const last4 = phone.slice(-4);
  const prefix = phone.slice(0, phone.length - 8);
  return `${prefix}****${last4}`;
}


export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
      return groups;
    },
    {} as Record<string, T[]>,
  );
}


export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}


export function sortBy<T>(
  array: T[],
  key: keyof T,
  direction: "asc" | "desc" = "asc",
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
}


export function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}


export function cleanParams<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    ),
  ) as Partial<T>;
}


export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  return keys.reduce(
    (acc, key) => {
      if (key in obj) acc[key] = obj[key];
      return acc;
    },
    {} as Pick<T, K>,
  );
}


export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result as Omit<T, K>;
}


export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Triggers a file download from a URL.
 *
 * downloadFile("https://cdn.../report.pdf", "March-report.pdf")
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


export function scrollToElement(id: string, offset: number = 0): void {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
}


export function isTouchDevice(): boolean {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}


export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}


export function isValidNigerianPhone(value: string): boolean {
  return /^(\+234|234|0)[789][01]\d{8}$/.test(value.replace(/\s/g, ""));
}

/**
 * Returns true if the value is a valid UUID v4.
 */
export function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

/**
 * Returns true if the password meets minimum requirements.
 * At least 8 chars, 1 number, 1 letter.
 */
export function isStrongPassword(value: string): boolean {
  return value.length >= 8 && /\d/.test(value) && /[a-zA-Z]/.test(value);
}

// ─────────────────────────────────────────────────────────────
// Status & colour helpers
// ─────────────────────────────────────────────────────────────

/**
 * Returns Tailwind badge classes for a vendor/user status.
 */
export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    approved: "bg-success-subtle text-success border-success-muted",
    active: "bg-success-subtle text-success border-success-muted",
    pending_approval: "bg-warning-subtle text-warning border-warning-muted",
    pending_payment: "bg-warning-subtle text-warning border-warning-muted",
    pending_verification: "bg-info-subtle    text-info    border-info-muted",
    rejected: "bg-error-subtle   text-error   border-error-muted",
    suspended: "bg-error-subtle   text-error   border-error-muted",
    expired: "bg-error-subtle   text-error   border-error-muted",
    cancelled: "bg-bg-subtle      text-text-muted border-border",
    past_due: "bg-warning-subtle text-warning border-warning-muted",
    processing: "bg-info-subtle    text-info    border-info-muted",
    failed: "bg-error-subtle   text-error   border-error-muted",
    ready: "bg-success-subtle text-success border-success-muted",
    pending: "bg-warning-subtle text-warning border-warning-muted",
    generating: "bg-info-subtle    text-info    border-info-muted",
  };
  return map[status] ?? "bg-bg-subtle text-text-muted border-border";
}

/**
 * Returns Tailwind badge classes for a subscription plan.
 */
export function getPlanBadgeClass(plan: string): string {
  const map: Record<string, string> = {
    free: "bg-bg-subtle      text-text-muted  border-border",
    basic: "bg-info-subtle    text-info        border-info-muted",
    pro: "bg-accent-subtle  text-accent      border-accent-muted",
    enterprise: "bg-primary-subtle text-primary     border-primary-muted",
  };
  return map[plan] ?? "bg-bg-subtle text-text-muted border-border";
}

/**
 * Returns a colour class for an avatar based on a string seed.
 * Deterministic — same name always produces the same colour.
 *
 * getAvatarColor("Adaeze Okonkwo")  → "bg-green-500"
 */
export function getAvatarColor(seed: string): string {
  const colors = [
    "bg-green-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-orange-500",
    "bg-cyan-500",
    "bg-pink-500",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Returns a human-readable label for a notification type.
 */
export function getNotificationTypeLabel(type: string): string {
  const map: Record<string, string> = {
    account_approved: "Account approved",
    account_rejected: "Account rejected",
    account_suspended: "Account suspended",
    subscription_activated: "Subscription activated",
    subscription_renewal: "Subscription renewal",
    subscription_expired: "Subscription expired",
    subscription_cancelled: "Subscription cancelled",
    plan_upgraded: "Plan upgraded",
    plan_downgrade_scheduled: "Plan downgrade scheduled",
    product_ready: "Product ready",
    product_failed: "Product processing failed",
    low_stock: "Low stock alert",
    daily_summary: "Daily sales summary",
    new_vendor: "New vendor application",
    system: "System message",
  };
  return map[type] ?? toTitleCase(type);
}

// ─────────────────────────────────────────────────────────────
// Local storage helpers
// ─────────────────────────────────────────────────────────────

/**
 * Safely gets a parsed value from localStorage.
 * Returns the fallback if the key is missing or parsing fails.
 */
export function getLocalStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safely sets a JSON-serialised value in localStorage.
 * Returns true on success, false on failure (e.g. quota exceeded).
 */
export function setLocalStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes a key from localStorage safely.
 */
export function removeLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // silently ignore
  }
}

// ─────────────────────────────────────────────────────────────
// Debounce & throttle
// ─────────────────────────────────────────────────────────────

/**
 * Returns a debounced version of a function.
 * The function is only called after `delay` ms of silence.
 *
 * const debouncedSearch = debounce(handleSearch, 400);
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Returns a throttled version of a function.
 * The function is called at most once every `limit` ms.
 *
 * const throttledScroll = throttle(handleScroll, 100);
 */
export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

// ─────────────────────────────────────────────────────────────
// Misc
// ─────────────────────────────────────────────────────────────

/**
 * Pauses execution for a given number of milliseconds.
 * Useful in tests and dev mocks.
 *
 * await sleep(1000);
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generates a random hex colour string.
 *
 * randomColor()  → "#a3f2b1"
 */
export function randomColor(): string {
  return (
    "#" +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0")
  );
}

/**
 * Returns true if the app is running in development mode.
 */
export const isDev = import.meta.env.DEV;

/**
 * Returns true if the app is running in production mode.
 */
export const isProd = import.meta.env.PROD;
