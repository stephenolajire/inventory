// src/pages/admin/notifications/components/NotificationsFiltersBar.tsx

import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { NotificationType } from "../../../../types";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface NotifFiltersState {
  type: NotificationType | "";
  is_read: "true" | "false" | "";
}

interface NotificationsFiltersBarProps {
  filters: NotifFiltersState;
  onChange: (patch: Partial<NotifFiltersState>) => void;
  onClear: () => void;
  showFilters: boolean;
  onToggle: () => void;
}

// ─────────────────────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: NotificationType | ""; label: string }[] = [
  { value: "", label: "All types" },
  { value: "account_approved", label: "Account approved" },
  { value: "account_rejected", label: "Account rejected" },
  { value: "account_suspended", label: "Account suspended" },
  { value: "subscription_activated", label: "Sub. activated" },
  { value: "subscription_renewal", label: "Renewal" },
  { value: "subscription_expired", label: "Expired" },
  { value: "subscription_cancelled", label: "Cancelled" },
  { value: "plan_upgraded", label: "Plan upgraded" },
  { value: "plan_downgrade_scheduled", label: "Plan downgrade" },
  { value: "product_ready", label: "Product ready" },
  { value: "product_failed", label: "Product failed" },
  { value: "low_stock", label: "Low stock" },
  { value: "daily_summary", label: "Daily summary" },
  { value: "new_vendor", label: "New vendor" },
  { value: "system", label: "System" },
];

const READ_OPTIONS = [
  { value: "", label: "All" },
  { value: "false", label: "Unread" },
  { value: "true", label: "Read" },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function NotificationsFiltersBar({
  filters,
  onChange,
  onClear,
  showFilters,
  onToggle,
}: NotificationsFiltersBarProps) {
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <>
      {/* ── Toggle row ── */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b border-border">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          All notifications
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={cn(
              "flex items-center gap-1.5 px-3 h-8 rounded-xl border text-xs font-semibold transition-all duration-150",
              showFilters || activeCount > 0
                ? "bg-primary-subtle border-primary-muted text-primary"
                : "border-border text-text-muted hover:border-primary-muted hover:text-text-primary",
            )}
          >
            <SlidersHorizontal size={12} />
            Filters
            {activeCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>

          {activeCount > 0 && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 px-2.5 h-8 rounded-xl border border-border text-xs text-text-muted hover:text-error hover:border-error-muted transition-all duration-150"
            >
              <X size={12} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Expanded panel ── */}
      {showFilters && (
        <div className="px-3 sm:px-4 py-4 border-b border-border bg-bg-subtle">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) =>
                  onChange({ type: e.target.value as NotificationType | "" })
                }
                className="input h-9 text-sm w-full"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Read status
              </label>
              <select
                value={filters.is_read}
                onChange={(e) =>
                  onChange({ is_read: e.target.value as "true" | "false" | "" })
                }
                className="input h-9 text-sm w-full"
              >
                {READ_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
