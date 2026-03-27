// src/pages/vendor/settings/paypal/components/PayPalOverviewSection.tsx

import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  CalendarDays,
  Wallet,
  ArrowUpRight,
  Ban,
} from "lucide-react";
import { useState } from "react";
import { cn } from "../../../../lib/utils";
import { useVendorPaypal } from "../../../../hooks/vendor/useVendorPaypal";
import { useVendorSubscription } from "../../../../hooks/vendor/useVendorSubscription";
import { OtpCancelModal } from "./OTPCancelModal";
import type { PayPalSubscription } from "../../../../hooks/vendor/useVendorPaypal";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function statusMeta(status: PayPalSubscription["status"] | undefined) {
  switch (status) {
    case "ACTIVE":
      return {
        icon: <CheckCircle2 size={14} />,
        label: "Active",
        cls: "badge-success",
      };
    case "APPROVAL_PENDING":
    case "APPROVED":
      return {
        icon: <Clock size={14} />,
        label: "Pending Approval",
        cls: "badge-warning",
      };
    case "SUSPENDED":
      return {
        icon: <AlertTriangle size={14} />,
        label: "Suspended",
        cls: "badge-warning",
      };
    case "CANCELLED":
      return {
        icon: <XCircle size={14} />,
        label: "Cancelled",
        cls: "badge-error",
      };
    case "EXPIRED":
      return {
        icon: <XCircle size={14} />,
        label: "Expired",
        cls: "badge-muted",
      };
    default:
      return {
        icon: <Clock size={14} />,
        label: "Unknown",
        cls: "badge-muted",
      };
  }
}

function fmt(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtAmount(amount: string | undefined): string {
  if (!amount) return "—";
  const n = parseFloat(amount);
  if (isNaN(n)) return amount;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(n);
}

// ─────────────────────────────────────────────────────────────
// Info row
// ─────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-2 text-text-muted text-xs">
        <span className="text-text-muted">{icon}</span>
        {label}
      </div>
      <div className="text-xs font-medium text-text-primary">{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────

function EmptyState({ onGoActivate }: { onGoActivate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-bg-subtle flex items-center justify-center">
        <Wallet size={22} className="text-text-muted" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">
          No PayPal subscription
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          Activate a plan via PayPal to get started
        </p>
      </div>
      <button onClick={onGoActivate} className="btn btn-primary btn-sm mt-1">
        <ArrowUpRight size={13} />
        Activate via PayPal
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

interface Props {
  paypal: ReturnType<typeof useVendorPaypal>;
  subscription: ReturnType<typeof useVendorSubscription>;
  onGoActivate: () => void;
}

export function PayPalOverviewSection({
  paypal,
  subscription,
  onGoActivate,
}: Props) {
  const [showCancelModal, setShowCancelModal] = useState(false);

  const paypalSub = paypal.subscription.data?.data;
  const vendorSub = subscription.subscription.data?.data;

  const meta = statusMeta(paypalSub?.status);

  if (!paypalSub) {
    return <EmptyState onGoActivate={onGoActivate} />;
  }

  const canCancel =
    paypalSub.status === "ACTIVE" || paypalSub.status === "APPROVED";

  return (
    <div className="space-y-4">
      {/* ── Status banner ── */}
      <div
        className={cn(
          "flex items-center justify-between p-4 rounded-2xl border",
          paypalSub.status === "ACTIVE"
            ? "bg-success-subtle border-success/20"
            : paypalSub.status === "SUSPENDED"
              ? "bg-warning-subtle border-warning/20"
              : "bg-bg-subtle border-border",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center",
              paypalSub.status === "ACTIVE"
                ? "bg-success/10 text-success"
                : "bg-bg-muted text-text-muted",
            )}
          >
            <Wallet size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              PayPal Subscription
            </p>
            <p className="text-xs text-text-muted font-mono mt-0.5">
              {paypalSub.paypal_sub_id}
            </p>
          </div>
        </div>
        <span className={cn("badge", meta.cls)}>
          {meta.icon}
          {meta.label}
        </span>
      </div>

      {/* ── Current vendor plan ── */}
      {vendorSub && (
        <div className="bg-primary-subtle border border-primary-muted rounded-2xl p-4">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            Current Plan
          </p>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-text-primary capitalize">
              {vendorSub.plan_display_name}
            </p>
            <span className="badge badge-primary capitalize">
              {vendorSub.billing_cycle}
            </span>
          </div>
        </div>
      )}

      {/* ── Detail rows ── */}
      <div className="bg-bg-subtle rounded-2xl px-4 py-1">
        <InfoRow
          icon={<CalendarDays size={13} />}
          label="Next billing"
          value={fmt(paypalSub.next_billing_time)}
        />
        <InfoRow
          icon={<Wallet size={13} />}
          label="Last payment"
          value={
            paypalSub.last_payment_amount !== "0"
              ? `${fmtAmount(paypalSub.last_payment_amount)} on ${fmt(paypalSub.last_payment_time)}`
              : "—"
          }
        />
        <InfoRow
          icon={<Clock size={13} />}
          label="Subscribed since"
          value={fmt(paypalSub.created_at)}
        />
        <InfoRow
          icon={<RefreshCw size={13} />}
          label="PayPal plan ID"
          value={
            <span className="font-mono text-xs text-text-muted">
              {paypalSub.paypal_plan_id || "—"}
            </span>
          }
        />
      </div>

      {/* ── Actions ── */}
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <button
          onClick={onGoActivate}
          className="btn btn-outline btn-sm flex-1"
        >
          <ArrowUpRight size={13} />
          Upgrade plan
        </button>

        {canCancel && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="btn btn-sm flex-1 border border-error-muted bg-error-subtle text-error hover:bg-error/10 transition-colors"
          >
            <Ban size={13} />
            Cancel subscription
          </button>
        )}
      </div>

      {/* ── Cancel modal ── */}
      {showCancelModal && (
        <OtpCancelModal
          cancelMutation={paypal.cancelSubscription}
          onClose={() => setShowCancelModal(false)}
        />
      )}
    </div>
  );
}
