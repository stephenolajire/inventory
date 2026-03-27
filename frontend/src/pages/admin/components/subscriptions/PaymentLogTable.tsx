// src/pages/admin/subscriptions/components/PaymentLogTable.tsx

import { Receipt, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, formatDate } from "../../../../lib/utils";
import { PlanBadge } from "./SubscriptionBadge";
import type { PaymentRecord, PaymentType } from "../../../../types";

// ─────────────────────────────────────────────────────────────
// Payment type badge
// ─────────────────────────────────────────────────────────────

const PAYMENT_TYPE_STYLES: Record<PaymentType, string> = {
  initial: "bg-info/10    text-info",
  upgrade: "bg-primary/10 text-primary",
  renewal: "bg-success/10 text-success",
};

function PaymentTypeBadge({ type }: { type: PaymentType }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${PAYMENT_TYPE_STYLES[type] ?? "bg-bg-muted text-text-muted"}`}
    >
      {type}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────

function Skeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-12 gap-3 px-4 py-3.5 animate-pulse"
        >
          <div className="col-span-3">
            <div className="h-3 bg-bg-muted rounded-full w-3/4" />
          </div>
          <div className="col-span-2">
            <div className="h-5 bg-bg-muted rounded-full w-14" />
          </div>
          <div className="col-span-2">
            <div className="h-5 bg-bg-muted rounded-full w-16" />
          </div>
          <div className="col-span-2">
            <div className="h-3 bg-bg-muted rounded-full w-2/3" />
          </div>
          <div className="col-span-2">
            <div className="h-3 bg-bg-muted rounded-full w-3/4" />
          </div>
          <div className="col-span-1">
            <div className="h-3 bg-bg-muted rounded-full w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Table
// ─────────────────────────────────────────────────────────────

interface Props {
  payments: PaymentRecord[];
  isLoading: boolean;
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageNext: () => void;
  onPagePrev: () => void;
}

export function PaymentLogTable({
  payments,
  isLoading,
  page,
  hasNext,
  hasPrev,
  onPageNext,
  onPagePrev,
}: Props) {
  return (
    <div className="bg-bg-surface rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
        <Receipt size={15} className="text-primary" />
        <h3 className="font-heading font-bold text-sm text-text-primary">
          Payment Log
        </h3>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-162.5">
          {/* Column headers */}
          <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-border bg-bg-subtle">
            <span className="col-span-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Vendor
            </span>
            <span className="col-span-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Plan
            </span>
            <span className="col-span-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Type
            </span>
            <span className="col-span-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Amount
            </span>
            <span className="col-span-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Date
            </span>
            <span className="col-span-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Cycle
            </span>
          </div>

          {/* Rows */}
          {isLoading ? (
            <Skeleton rows={6} />
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Receipt size={28} className="text-text-muted opacity-30" />
              <p className="text-sm text-text-muted">
                No payment records found
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-bg-subtle transition-colors"
                >
                  <div className="col-span-3 min-w-0">
                    <p className="text-sm text-text-primary truncate">
                      {p.vendor_email}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <PlanBadge plan={p.plan_name} />
                  </div>
                  <div className="col-span-2">
                    <PaymentTypeBadge type={p.payment_type} />
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-semibold text-text-primary">
                      {formatCurrency(p.amount)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-text-muted">
                      {formatDate(p.created_at)}
                    </p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-xs text-text-muted capitalize">
                      {p.billing_cycle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
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
