// src/pages/vendor/subscription/sections/OverviewSection.tsx
import { Link } from "react-router-dom";
import { useVendorSubscription } from "../../../../hooks/vendor/useVendorSubscription";
import { ROUTES } from "../../../../constants/routes";
import {
  Zap,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  BarChart2,
  FileText,
  GitBranch,
  Package,
} from "lucide-react";
import type { ActiveSubscription } from "../../../../types";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysRemaining(dateStr: string | null): number {
  if (!dateStr) return 0;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string; bg: string }
> = {
  active: {
    label: "Active",
    color: "text-green-700",
    dot: "bg-green-500",
    bg: "bg-green-50 border-green-200",
  },
  past_due: {
    label: "Past Due",
    color: "text-amber-700",
    dot: "bg-amber-500",
    bg: "bg-amber-50 border-amber-200",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-700",
    dot: "bg-red-500",
    bg: "bg-red-50 border-red-200",
  },
  expired: {
    label: "Expired",
    color: "text-slate-600",
    dot: "bg-slate-400",
    bg: "bg-slate-100 border-slate-200",
  },
  pending_payment: {
    label: "Pending Payment",
    color: "text-blue-700",
    dot: "bg-blue-500",
    bg: "bg-blue-50 border-blue-200",
  },
  pending_approval: {
    label: "Pending Approval",
    color: "text-slate-600",
    dot: "bg-slate-400",
    bg: "bg-slate-100 border-slate-200",
  },
};

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function FeatureChip({
  enabled,
  label,
  icon: Icon,
}: {
  enabled: boolean;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
        enabled
          ? "bg-green-50 border-green-100 text-green-700"
          : "bg-slate-50 border-slate-100 text-slate-400"
      }`}
    >
      <Icon size={14} />
      <span className="font-medium">{label}</span>
      {enabled ? (
        <CheckCircle2 size={13} className="ml-auto text-green-500" />
      ) : (
        <XCircle size={13} className="ml-auto text-slate-300" />
      )}
    </div>
  );
}

function PendingChangeBanner({ sub }: { sub: ActiveSubscription }) {
  const change = sub.pending_change;
  if (!change) return null;

  const isPendingCancel = change.change_type === "cancellation";
  const isPendingDowngrade = change.change_type === "downgrade";

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${
        isPendingCancel
          ? "bg-red-50 border-red-200 text-red-700"
          : "bg-amber-50 border-amber-200 text-amber-700"
      }`}
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-semibold">
          {isPendingCancel
            ? "Cancellation scheduled"
            : isPendingDowngrade
              ? `Downgrade to ${change.new_plan_name} scheduled`
              : "Plan change scheduled"}
        </p>
        <p className="text-xs mt-0.5 opacity-80">
          Effective {formatDate(change.effective_at)}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export default function OverviewSection() {
  const { subscription, reactivate, isLoading } = useVendorSubscription();
  const sub = subscription.data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 gap-2">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Loading your subscription…</span>
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package size={24} className="text-slate-400" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No active plan</h3>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          You don't have an active subscription yet.
        </p>
        <Link
          to={ROUTES.SUBSCRIPTION_ACTIVATE}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors"
        >
          <Zap size={15} /> Activate a plan
        </Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG["expired"];
  const days = daysRemaining(sub.current_period_end);
  const isCancelled =
    sub.status === "cancelled" ||
    !!sub.pending_change?.change_type.includes("cancellation");

  return (
    <div className="space-y-5">
      {/* Pending change banner */}
      <PendingChangeBanner sub={sub} />

      {/* ── Plan card ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {/* Header strip */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center shadow-sm shadow-green-200">
              <Zap size={18} className="text-white fill-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {sub.plan_display_name} Plan
              </h2>
              <p className="text-xs text-slate-500">
                {sub.billing_cycle === "yearly"
                  ? "Annual billing"
                  : "Monthly billing"}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${status.bg} ${status.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-5 grid grid-cols-3 gap-6">
          {/* Period */}
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1">
              <Calendar size={11} /> Current period
            </p>
            <p className="text-sm font-semibold text-slate-800">
              {formatDate(sub.current_period_start)}
            </p>
            <p className="text-xs text-slate-400">
              → {formatDate(sub.current_period_end)}
            </p>
          </div>

          {/* Days left */}
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1">
              <Clock size={11} /> Days remaining
            </p>
            <p
              className={`text-2xl font-black tracking-tight ${
                days <= 7
                  ? "text-red-600"
                  : days <= 14
                    ? "text-amber-600"
                    : "text-slate-800"
              }`}
            >
              {days}
            </p>
            <p className="text-xs text-slate-400">days left</p>
          </div>

          {/* Amount */}
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1">
              <RefreshCw size={11} /> Last payment
            </p>
            <p className="text-sm font-bold text-slate-800">
              £{Number(sub.amount_paid).toLocaleString("en-NG")}
            </p>
            <p className="text-xs text-slate-400">{sub.currency}</p>
          </div>
        </div>

        {/* Days bar */}
        <div className="px-6 pb-5">
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                days <= 7
                  ? "bg-red-500"
                  : days <= 14
                    ? "bg-amber-400"
                    : "bg-green-500"
              }`}
              style={{
                width: `${Math.min(100, (days / (sub.billing_cycle === "yearly" ? 365 : 30)) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Plan features</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <FeatureChip
            enabled={true}
            label={`${sub.product_limit.toLocaleString()} products`}
            icon={Package}
          />
          <FeatureChip
            enabled={sub.has_analytics}
            label="Analytics"
            icon={BarChart2}
          />
          <FeatureChip
            enabled={sub.has_reports}
            label="Reports"
            icon={FileText}
          />
          <FeatureChip enabled={false} label="Multi-branch" icon={GitBranch} />
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Quick actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {isCancelled ? (
            <button
              onClick={() =>
                reactivate.mutate({
                  plan: sub.plan_name,
                  billing_cycle: sub.billing_cycle,
                })
              }
              disabled={reactivate.isPending}
              className="col-span-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {reactivate.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Reactivate subscription
            </button>
          ) : (
            <>
              <Link
                to={ROUTES.SUBSCRIPTION_UPGRADE}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors"
              >
                <ArrowUpCircle size={14} /> Upgrade plan
              </Link>
              <Link
                to={ROUTES.SUBSCRIPTION_DOWNGRADE}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ArrowDownCircle size={14} /> Downgrade plan
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
