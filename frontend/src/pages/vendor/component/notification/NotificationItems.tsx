// src/pages/vendor/notifications/components/NotificationItem.tsx

import { Link } from "react-router-dom";
import {
  Bell,
  Package,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShoppingCart,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { cn, timeAgo, getNotificationTypeLabel } from "../../../../lib/utils";
import type { NotificationListItem, NotificationType } from "../../../../types";

// ─────────────────────────────────────────────────────────────
// Icon map
// ─────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, React.ReactNode> = {
  account_approved: <CheckCircle2 size={16} />,
  account_rejected: <AlertTriangle size={16} />,
  account_suspended: <AlertTriangle size={16} />,
  subscription_activated: <CreditCard size={16} />,
  subscription_renewal: <CreditCard size={16} />,
  subscription_expired: <CreditCard size={16} />,
  subscription_cancelled: <CreditCard size={16} />,
  plan_upgraded: <TrendingUp size={16} />,
  plan_downgrade_scheduled: <TrendingUp size={16} />,
  product_ready: <Package size={16} />,
  product_failed: <Package size={16} />,
  low_stock: <AlertTriangle size={16} />,
  daily_summary: <ShoppingCart size={16} />,
  new_vendor: <Bell size={16} />,
  system: <Info size={16} />,
};

const TYPE_COLOR: Record<string, string> = {
  account_approved: "bg-success-subtle text-success border-success-muted",
  account_rejected: "bg-error-subtle   text-error   border-error-muted",
  account_suspended: "bg-error-subtle   text-error   border-error-muted",
  subscription_activated: "bg-primary-subtle text-primary border-primary-muted",
  subscription_renewal: "bg-primary-subtle text-primary border-primary-muted",
  subscription_expired: "bg-warning-subtle text-warning border-warning-muted",
  subscription_cancelled: "bg-bg-subtle      text-text-muted border-border",
  plan_upgraded: "bg-success-subtle text-success border-success-muted",
  plan_downgrade_scheduled:
    "bg-warning-subtle text-warning border-warning-muted",
  product_ready: "bg-success-subtle text-success border-success-muted",
  product_failed: "bg-error-subtle   text-error   border-error-muted",
  low_stock: "bg-warning-subtle text-warning border-warning-muted",
  daily_summary: "bg-info-subtle    text-info    border-info-muted",
  new_vendor: "bg-primary-subtle text-primary border-primary-muted",
  system: "bg-bg-subtle      text-text-muted border-border",
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

interface NotificationItemProps {
  notification: NotificationListItem;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  isDeleting,
}: NotificationItemProps) {
  const type = notification.notification_type as NotificationType;
  const icon = TYPE_ICON[type] ?? <Bell size={16} />;
  const color =
    TYPE_COLOR[type] ?? "bg-bg-subtle text-text-muted border-border";
  const isUnread = !notification.is_read;

  function handleClick() {
    if (isUnread) onMarkRead(notification.id);
  }

  return (
    <div
      className={cn(
        "relative flex items-start gap-4 px-5 py-4 border-b border-border last:border-0",
        "transition-colors duration-150 group",
        isUnread
          ? "bg-primary-subtle/30 hover:bg-primary-subtle/50"
          : "hover:bg-bg-subtle",
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      {/* Unread dot */}
      {isUnread && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5",
          color,
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* Type label */}
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              {getNotificationTypeLabel(type)}
            </span>

            {/* Title */}
            <p
              className={cn(
                "text-sm leading-snug mt-0.5",
                isUnread
                  ? "font-semibold text-text-primary"
                  : "font-medium text-text-secondary",
              )}
            >
              {notification.title}
            </p>

            {/* Message */}
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              {notification.message}
            </p>

            {/* Time + action link */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-text-muted">
                {timeAgo(notification.created_at)}
              </span>
              {notification.action_url && (
                <Link
                  to={notification.action_url}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                >
                  View
                  <ExternalLink size={9} />
                </Link>
              )}
            </div>
          </div>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            disabled={isDeleting}
            aria-label="Delete notification"
            className="
              w-7 h-7 rounded-lg flex items-center justify-center shrink-0
              text-text-muted hover:text-error hover:bg-error-subtle
              opacity-0 group-hover:opacity-100
              transition-all duration-150 disabled:opacity-40
            "
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
