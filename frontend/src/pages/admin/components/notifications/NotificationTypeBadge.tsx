// src/pages/admin/notifications/components/NotificationTypeBadge.tsx

import { cn } from "../../../../lib/utils";
import type { NotificationType } from "../../../../types";

// ─────────────────────────────────────────────────────────────
// Colour mapping — grouped by category
// ─────────────────────────────────────────────────────────────

const TYPE_CLASSES: Partial<Record<NotificationType, string>> = {
  // Account
  account_approved: "bg-success-subtle text-success border-success-muted",
  account_rejected: "bg-error-subtle text-error border-error-muted",
  account_suspended: "bg-error-subtle text-error border-error-muted",

  // Subscription
  subscription_activated: "bg-success-subtle text-success border-success-muted",
  subscription_renewal: "bg-info-subtle text-info border-info-muted",
  subscription_expired: "bg-bg-subtle text-text-muted border-border",
  subscription_cancelled: "bg-bg-subtle text-text-muted border-border",
  plan_upgraded: "bg-primary-subtle text-primary border-primary-muted",
  plan_downgrade_scheduled:
    "bg-warning-subtle text-warning border-warning-muted",

  // Products
  product_ready: "bg-success-subtle text-success border-success-muted",
  product_failed: "bg-error-subtle text-error border-error-muted",
  low_stock: "bg-warning-subtle text-warning border-warning-muted",

  // System
  daily_summary: "bg-info-subtle text-info border-info-muted",
  new_vendor: "bg-primary-subtle text-primary border-primary-muted",
  system: "bg-bg-subtle text-text-muted border-border",
};

const TYPE_LABEL: Partial<Record<NotificationType, string>> = {
  account_approved: "Approved",
  account_rejected: "Rejected",
  account_suspended: "Suspended",
  subscription_activated: "Sub. activated",
  subscription_renewal: "Renewal",
  subscription_expired: "Expired",
  subscription_cancelled: "Cancelled",
  plan_upgraded: "Upgraded",
  plan_downgrade_scheduled: "Downgrade",
  product_ready: "Product ready",
  product_failed: "Product failed",
  low_stock: "Low stock",
  daily_summary: "Daily summary",
  new_vendor: "New vendor",
  system: "System",
};

export function NotificationTypeBadge({ type }: { type: NotificationType }) {
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap",
        TYPE_CLASSES[type] ?? "bg-bg-subtle text-text-muted border-border",
      )}
    >
      {TYPE_LABEL[type] ?? type}
    </span>
  );
}
