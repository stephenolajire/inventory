// src/pages/admin/subscriptions/components/SubscriptionsTable.tsx

import {
  CreditCard,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "../../../../lib/utils";
import { SubscriptionStatusBadge, PlanBadge } from "./SubscriptionBadge";
import type {
  AdminSubscriptionListItem,
  SubscriptionStatus,
  PlanName,
  BillingCycle,
} from "../../../../types";

// ─────────────────────────────────────────────────────────────
// Filter option constants
// ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: SubscriptionStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "past_due", label: "Past Due" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

const PLAN_OPTIONS: { value: PlanName | ""; label: string }[] = [
  { value: "", label: "All Plans" },
  { value: "free", label: "Free" },
  { value: "basic", label: "Basic" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
];

const CYCLE_OPTIONS: { value: BillingCycle | ""; label: string }[] = [
  { value: "", label: "All Cycles" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ActionMode = "override" | "expire";

interface Filters {
  search?: string;
  status?: SubscriptionStatus;
  plan?: PlanName;
  billing_cycle?: BillingCycle;
}

interface SubscriptionsTableProps {
  subscriptions: AdminSubscriptionListItem[];
  isLoading: boolean;
  filters: Filters;
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
  onFilterChange: (f: Filters) => void;
  onPageNext: () => void;
  onPagePrev: () => void;
  onAction: (mode: ActionMode, sub: AdminSubscriptionListItem) => void;
}

// ─────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────

function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-12 gap-3 px-4 py-3.5 animate-pulse"
        >
          <div className="col-span-3 flex items-center gap-2">
            <div className="h-3 bg-bg-muted rounded-full flex-1" />
          </div>
          <div className="col-span-2 flex items-center">
            <div className="h-5 bg-bg-muted rounded-full w-14" />
          </div>
          <div className="col-span-2 flex items-center">
            <div className="h-5 bg-bg-muted rounded-full w-20" />
          </div>
          <div className="col-span-2 flex items-center">
            <div className="h-3 bg-bg-muted rounded-full w-3/4" />
          </div>
          <div className="col-span-2 flex items-center">
            <div className="h-3 bg-bg-muted rounded-full w-2/3" />
          </div>
          <div className="col-span-1 flex items-center justify-end gap-1">
            <div className="w-7 h-7 bg-bg-muted rounded-lg" />
            <div className="w-7 h-7 bg-bg-muted rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Table
// ─────────────────────────────────────────────────────────────

export function SubscriptionsTable({
  subscriptions,
  isLoading,
  filters,
  page,
  hasNext,
  hasPrev,
  onFilterChange,
  onPageNext,
  onPagePrev,
  onAction,
}: SubscriptionsTableProps) {
  const hasFilters = !!(
    filters.search ||
    filters.status ||
    filters.plan ||
    filters.billing_cycle
  );

  return (
    <div className="bg-bg-surface rounded-2xl border border-border overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-border flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search vendor email…"
            value={filters.search ?? ""}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                search: e.target.value || undefined,
              })
            }
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-bg-subtle border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        {/* Plan filter */}
        <div className="relative">
          <Filter
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <select
            value={filters.plan ?? ""}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                plan: (e.target.value as PlanName) || undefined,
              })
            }
            className="pl-8 pr-8 py-2.5 rounded-xl appearance-none bg-bg-subtle border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
          >
            {PLAN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <select
            value={filters.status ?? ""}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                status: (e.target.value as SubscriptionStatus) || undefined,
              })
            }
            className="pl-8 pr-8 py-2.5 rounded-xl appearance-none bg-bg-subtle border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cycle filter */}
        <div className="relative">
          <Filter
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <select
            value={filters.billing_cycle ?? ""}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                billing_cycle: (e.target.value as BillingCycle) || undefined,
              })
            }
            className="pl-8 pr-8 py-2.5 rounded-xl appearance-none bg-bg-subtle border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
          >
            {CYCLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <div className="min-w-187.5">
          {/* Header */}
          <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-border bg-bg-subtle">
            <span className="col-span-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Vendor
            </span>
            <span className="col-span-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Plan
            </span>
            <span className="col-span-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Status
            </span>
            <span className="col-span-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Amount Paid
            </span>
            <span className="col-span-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Expires
            </span>
            <span className="col-span-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider text-right">
              Actions
            </span>
          </div>

          {/* Rows */}
          {isLoading ? (
            <TableSkeleton rows={8} />
          ) : subscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <CreditCard size={32} className="text-text-muted opacity-30" />
              <p className="text-sm text-text-muted">No subscriptions found</p>
              {hasFilters && (
                <button
                  onClick={() => onFilterChange({})}
                  className="text-xs text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {subscriptions.map((sub) => (
                <SubscriptionRow key={sub.id} sub={sub} onAction={onAction} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Pagination ── */}
      {(hasNext || hasPrev) && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-bg-subtle">
          <span className="text-xs text-text-muted">Page {page}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onPagePrev}
              disabled={!hasPrev}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-border text-text-muted hover:text-text-primary hover:bg-bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={onPageNext}
              disabled={!hasNext}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-border text-text-muted hover:text-text-primary hover:bg-bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Subscription row
// ─────────────────────────────────────────────────────────────

interface RowProps {
  sub: AdminSubscriptionListItem;
  onAction: (mode: ActionMode, sub: AdminSubscriptionListItem) => void;
}

function SubscriptionRow({ sub, onAction }: RowProps) {
  const isExpiredOrCancelled =
    sub.status === "expired" || sub.status === "cancelled";

  return (
    <div className="grid grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-bg-subtle transition-colors duration-100">
      {/* Vendor */}
      <div className="col-span-3 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {sub.vendor_email}
        </p>
        <p className="text-xs text-text-muted capitalize">
          {sub.billing_cycle}
        </p>
      </div>

      {/* Plan */}
      <div className="col-span-2">
        <PlanBadge plan={sub.plan_name} />
      </div>

      {/* Status */}
      <div className="col-span-2">
        <SubscriptionStatusBadge status={sub.status} />
      </div>

      {/* Amount */}
      <div className="col-span-2">
        <p className="text-sm font-semibold text-text-primary">
          {formatCurrency(sub.amount_paid)}
        </p>
        <p className="text-xs text-text-muted">{sub.currency}</p>
      </div>

      {/* Expires */}
      <div className="col-span-2">
        <p className="text-sm text-text-primary">
          {sub.current_period_end ? formatDate(sub.current_period_end) : "—"}
        </p>
      </div>

      {/* Actions */}
      <div className="col-span-1 flex items-center justify-end gap-1">
        <ActionBtn
          label="Override Plan"
          icon={<RefreshCw size={13} />}
          onClick={() => onAction("override", sub)}
          disabled={isExpiredOrCancelled}
          className="hover:bg-primary/10 hover:text-primary"
        />
        <ActionBtn
          label="Force Expire"
          icon={<XCircle size={13} />}
          onClick={() => onAction("expire", sub)}
          disabled={isExpiredOrCancelled}
          className="hover:bg-danger/10 hover:text-danger"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Action button
// ─────────────────────────────────────────────────────────────

interface ActionBtnProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className: string;
}

function ActionBtn({
  label,
  icon,
  onClick,
  disabled,
  className,
}: ActionBtnProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
      className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center text-text-muted transition-all duration-150",
        disabled ? "opacity-30 cursor-not-allowed" : className,
      )}
    >
      {icon}
    </button>
  );
}
