// src/pages/admin/subscriptions/components/SubscriptionActionModals.tsx

import { useState } from "react";
import { X, RefreshCw, AlertTriangle } from "lucide-react";
import type {
  AdminSubscriptionListItem,
  PlanName,
  BillingCycle,
} from "../../../../types";

const PLAN_OPTIONS: PlanName[] = ["free", "basic", "pro", "enterprise"];
const CYCLE_OPTIONS: BillingCycle[] = ["monthly", "yearly"];

// ─────────────────────────────────────────────────────────────
// Override Plan Modal
// ─────────────────────────────────────────────────────────────

interface OverrideModalProps {
  open: boolean;
  subscription: AdminSubscriptionListItem | null;
  isLoading: boolean;
  onConfirm: (
    planName: PlanName,
    billingCycle: BillingCycle,
    reason: string,
  ) => void;
  onClose: () => void;
}

export function OverridePlanModal({
  open,
  subscription,
  isLoading,
  onConfirm,
  onClose,
}: OverrideModalProps) {
  const [planName, setPlanName] = useState<PlanName>("basic");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [reason, setReason] = useState("");

  if (!open || !subscription) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-bg-surface rounded-2xl border border-border shadow-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <RefreshCw size={16} className="text-primary" />
            </div>
            <h2 className="font-heading font-bold text-base text-text-primary">
              Override Plan
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-bg-subtle transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <p className="text-sm text-text-muted mb-4">
          Overriding plan for{" "}
          <span className="font-semibold text-text-primary">
            {subscription.vendor_email}
          </span>
          . Current plan:{" "}
          <span className="font-semibold text-text-primary capitalize">
            {subscription.plan_name}
          </span>
          .
        </p>

        <div className="space-y-3.5">
          {/* New plan */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">
              New Plan <span className="text-danger">*</span>
            </label>
            <select
              value={planName}
              onChange={(e) => setPlanName(e.target.value as PlanName)}
              className="w-full px-3 py-2.5 rounded-xl bg-bg-subtle border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer capitalize"
            >
              {PLAN_OPTIONS.map((p) => (
                <option key={p} value={p} className="capitalize">
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Billing cycle */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">
              Billing Cycle
            </label>
            <div className="flex gap-2">
              {CYCLE_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBillingCycle(c)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all capitalize ${
                    billingCycle === c
                      ? "bg-primary text-white border-primary"
                      : "bg-bg-subtle border-border text-text-muted hover:bg-bg-surface"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">
              Reason <span className="text-danger">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="Why is this plan being overridden?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-bg-subtle border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-muted hover:bg-bg-subtle transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(planName, billingCycle, reason)}
            disabled={!reason.trim() || isLoading}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Override Plan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Expire Subscription Modal
// ─────────────────────────────────────────────────────────────

interface ExpireModalProps {
  open: boolean;
  subscription: AdminSubscriptionListItem | null;
  isLoading: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export function ExpireSubscriptionModal({
  open,
  subscription,
  isLoading,
  onConfirm,
  onClose,
}: ExpireModalProps) {
  const [reason, setReason] = useState("");

  if (!open || !subscription) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-bg-surface rounded-2xl border border-border shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-danger/10 flex items-center justify-center">
              <AlertTriangle size={16} className="text-danger" />
            </div>
            <h2 className="font-heading font-bold text-base text-text-primary">
              Force Expire
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-bg-subtle transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <p className="text-sm text-text-muted mb-4">
          Force expire the{" "}
          <span className="font-semibold text-text-primary capitalize">
            {subscription.plan_name}
          </span>{" "}
          subscription for{" "}
          <span className="font-semibold text-text-primary">
            {subscription.vendor_email}
          </span>
          ?
        </p>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-text-muted mb-1.5">
            Reason <span className="text-danger">*</span>
          </label>
          <textarea
            rows={2}
            placeholder="Why is this subscription being expired?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-bg-subtle border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-danger/30 focus:border-danger transition-all resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-muted hover:bg-bg-subtle transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || isLoading}
            className="flex-1 py-2.5 rounded-xl bg-danger text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Force Expire
          </button>
        </div>
      </div>
    </div>
  );
}
