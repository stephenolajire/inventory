// src/pages/vendor/notifications/components/NotificationsHeader.tsx

import { CheckCheck, Trash2, SlidersHorizontal } from "lucide-react";
import { cn } from "../../../../lib/utils";

interface NotificationsHeaderProps {
  unreadCount: number;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onToggleFilter: () => void;
  filterOpen: boolean;
  isMarkingAllRead: boolean;
  isClearing: boolean;
}

export function NotificationsHeader({
  unreadCount,
  onMarkAllRead,
  onClearAll,
  onToggleFilter,
  filterOpen,
  isMarkingAllRead,
  isClearing,
}: NotificationsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      {/* Left */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="font-heading font-extrabold text-xl text-text-primary">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs font-bold">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted mt-0.5">
          {unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
            : "All caught up"}
        </p>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        {/* Filter toggle */}
        <button
          onClick={onToggleFilter}
          className={cn(
            "h-9 px-3 rounded-xl border text-xs font-medium",
            "flex items-center gap-1.5 transition-all duration-150",
            filterOpen
              ? "bg-primary-subtle text-primary border-primary-muted"
              : "bg-bg-surface text-text-muted border-border hover:text-text-primary",
          )}
        >
          <SlidersHorizontal size={13} />
          <span className="hidden sm:inline">Filter</span>
        </button>

        {/* Mark all read */}
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            disabled={isMarkingAllRead}
            className="
              h-9 px-3 rounded-xl border border-border
              flex items-center gap-1.5 text-xs font-medium
              text-text-muted hover:text-success hover:border-success-muted hover:bg-success-subtle
              transition-all duration-150 disabled:opacity-50
            "
          >
            <CheckCheck size={13} />
            <span className="hidden sm:inline">Mark all read</span>
          </button>
        )}

        {/* Clear all */}
        <button
          onClick={() => {
            if (
              window.confirm("Clear all notifications? This cannot be undone.")
            ) {
              onClearAll();
            }
          }}
          disabled={isClearing}
          className="
            h-9 px-3 rounded-xl border border-border
            flex items-center gap-1.5 text-xs font-medium
            text-text-muted hover:text-error hover:border-error-muted hover:bg-error-subtle
            transition-all duration-150 disabled:opacity-50
          "
        >
          <Trash2 size={13} />
          <span className="hidden sm:inline">Clear all</span>
        </button>
      </div>
    </div>
  );
}
