// src/pages/admin/components/activities/ActivityActionTypeBadge.tsx

import type { ActivityActionType } from "../../../../types";
import { cn } from "../../../../lib/utils";

interface ActivityActionTypeBadgeProps {
  actionType: ActivityActionType;
  display: string;
  compact?: boolean;
}

const ACTION_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  // Generic
  create: { bg: "bg-success-subtle", text: "text-success" },
  update: { bg: "bg-info-subtle", text: "text-info" },
  delete: { bg: "bg-error-subtle", text: "text-error" },
  view: { bg: "bg-primary-subtle", text: "text-primary" },
  restore: { bg: "bg-warning-subtle", text: "text-warning" },

  // User actions
  login: { bg: "bg-primary-subtle", text: "text-primary" },
  logout: { bg: "bg-info-subtle", text: "text-info" },
  password_changed: { bg: "bg-warning-subtle", text: "text-warning" },
  profile_updated: { bg: "bg-info-subtle", text: "text-info" },

  // Product actions
  product_uploaded: { bg: "bg-success-subtle", text: "text-success" },
  product_approved: { bg: "bg-success-subtle", text: "text-success" },
  product_rejected: { bg: "bg-error-subtle", text: "text-error" },
  stock_updated: { bg: "bg-warning-subtle", text: "text-warning" },

  // Sales actions
  order_created: { bg: "bg-primary-subtle", text: "text-primary" },
  order_confirmed: { bg: "bg-success-subtle", text: "text-success" },
  order_shipped: { bg: "bg-info-subtle", text: "text-info" },
  order_delivered: { bg: "bg-success-subtle", text: "text-success" },
  order_cancelled: { bg: "bg-error-subtle", text: "text-error" },
  refund_requested: { bg: "bg-warning-subtle", text: "text-warning" },
  refund_approved: { bg: "bg-success-subtle", text: "text-success" },

  // Subscription actions
  subscription_created: { bg: "bg-primary-subtle", text: "text-primary" },
  subscription_upgraded: { bg: "bg-success-subtle", text: "text-success" },
  subscription_downgraded: { bg: "bg-warning-subtle", text: "text-warning" },
  subscription_cancelled: { bg: "bg-error-subtle", text: "text-error" },
  subscription_renewed: { bg: "bg-success-subtle", text: "text-success" },

  // Payment actions
  payment_processed: { bg: "bg-success-subtle", text: "text-success" },
  payment_failed: { bg: "bg-error-subtle", text: "text-error" },
  payment_refunded: { bg: "bg-info-subtle", text: "text-info" },

  // Admin actions
  user_approved: { bg: "bg-success-subtle", text: "text-success" },
  user_rejected: { bg: "bg-error-subtle", text: "text-error" },
  user_suspended: { bg: "bg-error-subtle", text: "text-error" },
  user_unsuspended: { bg: "bg-success-subtle", text: "text-success" },

  // Analytics
  report_generated: { bg: "bg-primary-subtle", text: "text-primary" },
  export_created: { bg: "bg-info-subtle", text: "text-info" },
};

export function ActivityActionTypeBadge({
  actionType,
  display,
  compact = false,
}: ActivityActionTypeBadgeProps) {
  const colors = ACTION_TYPE_COLORS[actionType] || {
    bg: "bg-bg-subtle",
    text: "text-text-muted",
  };

  return (
    <span
      className={cn(
        "inline-block font-medium rounded-lg border",
        colors.bg,
        colors.text,
        "border-transparent",
        compact ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
      )}
    >
      {display}
    </span>
  );
}
