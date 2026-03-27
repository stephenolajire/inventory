// src/pages/vendor/settings/paypal/components/PayPalOrderHistorySection.tsx

import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  PackageOpen,
} from "lucide-react";
import { cn } from "../../../../lib/utils";
import { useVendorPaypal } from "../../../../hooks/vendor/useVendorPaypal";
import type { PayPalOrder } from "../../../../hooks/vendor/useVendorPaypal";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function statusMeta(status: PayPalOrder["status"]) {
  switch (status) {
    case "COMPLETED":
      return {
        icon: <CheckCircle2 size={12} />,
        label: "Completed",
        cls: "badge-success",
      };
    case "CREATED":
    case "APPROVED":
      return {
        icon: <Clock size={12} />,
        label: status === "CREATED" ? "Pending" : "Approved",
        cls: "badge-warning",
      };
    case "FAILED":
      return {
        icon: <XCircle size={12} />,
        label: "Failed",
        cls: "badge-error",
      };
    case "VOIDED":
      return {
        icon: <XCircle size={12} />,
        label: "Voided",
        cls: "badge-muted",
      };
    default:
      return {
        icon: <Clock size={12} />,
        label: status,
        cls: "badge-muted",
      };
  }
}

function fmt(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtAmount(amount: string, currency: string): string {
  const n = parseFloat(amount);
  if (isNaN(n)) return amount;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    minimumFractionDigits: 2,
  }).format(n);
}

// ─────────────────────────────────────────────────────────────
// Order row
// ─────────────────────────────────────────────────────────────

function OrderRow({ order }: { order: PayPalOrder }) {
  const meta = statusMeta(order.status);

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
            order.status === "COMPLETED"
              ? "bg-success/10 text-success"
              : order.status === "FAILED"
                ? "bg-error/10 text-error"
                : "bg-warning/10 text-warning",
          )}
        >
          {order.status === "COMPLETED" ? (
            <CheckCircle2 size={15} />
          ) : order.status === "FAILED" ? (
            <XCircle size={15} />
          ) : (
            <Clock size={15} />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-text-primary capitalize">
              {order.intent === "activation"
                ? "Plan activation"
                : "Plan upgrade"}
            </span>
            <span className={cn("badge", meta.cls)}>
              {meta.icon}
              {meta.label}
            </span>
          </div>
          <p className="text-[11px] text-text-muted font-mono truncate mt-0.5">
            {order.paypal_order_id}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            {fmt(order.created_at)}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-text-primary">
          {fmtAmount(order.amount, order.currency)}
        </p>
        <p className="text-[11px] text-text-muted uppercase">
          {order.currency}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-bg-subtle flex items-center justify-center">
        <PackageOpen size={20} className="text-text-muted" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">No orders yet</p>
        <p className="text-xs text-text-muted mt-0.5">
          Your PayPal payment history will appear here
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

interface Props {
  paypal: ReturnType<typeof useVendorPaypal>;
}

export function PayPalOrderHistorySection({ paypal }: Props) {
  const orders = paypal.orders.data?.results ?? [];
  const total = paypal.orders.data?.count ?? 0;

  if (paypal.orders.isError) {
    return (
      <div className="flex gap-2 p-3 rounded-xl bg-error-subtle border border-error/20 text-xs text-error">
        <XCircle size={13} className="shrink-0 mt-0.5" />
        Failed to load order history. Please refresh.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs mt-5 font-semibold text-text-muted uppercase tracking-wider">
          Payment history
          {total > 0 && (
            <span className="ml-2 badge badge-muted normal-case tracking-normal">
              {total} {total === 1 ? "order" : "orders"}
            </span>
          )}
        </p>
        {total > 0 && (
          <button
            onClick={() => paypal.orders.refetch()}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <ArrowUpRight size={12} />
            Refresh
          </button>
        )}
      </div>

      {/* List */}
      {orders.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-bg-subtle rounded-2xl px-4 py-1">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
