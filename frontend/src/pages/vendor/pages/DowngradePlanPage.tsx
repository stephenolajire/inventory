// src/pages/vendor/subscription/pages/DowngradePlanPage.tsx
import { useState } from "react";
import { useVendorSubscription } from "../../../hooks/vendor/useVendorSubscription";
import {
  PlansGrid,
  BillingCycleToggle,
} from "../component/subscription/PlansSection";
import type { SubscriptionPlan, BillingCycle } from "../../../types";
import {
  ArrowDownCircle,
  Loader2,
  AlertTriangle,
  Calendar,
  Info,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

export default function DowngradePlanPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const { plans, subscription, downgrade } = useVendorSubscription();

  const sub = subscription.data?.data;

  const allPlans =
    ((plans.data as any)?.data as SubscriptionPlan[] | undefined) ?? [];

  const currentPlanObj = allPlans.find((p) => p.name === sub?.plan_name);
  const currentPrice = Number(currentPlanObj?.monthly_price_gbp ?? 0);

  const downgradablePlans = allPlans.filter(
    (p) => Number(p.monthly_price_gbp) < currentPrice,
  );

  // ── Guard: loading ──────────────────────────────────────
  if (subscription.isLoading || plans.isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 gap-2">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  // ── Guard: no active subscription ──────────────────────
  if (!sub || sub.status !== "active") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
        <AlertTriangle size={24} className="text-amber-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-amber-800">
          No active subscription
        </h3>
        <p className="text-sm text-amber-700 mt-1">
          You need an active subscription to downgrade.
        </p>
      </div>
    );
  }

  // ── Guard: pending change ───────────────────────────────
  if (sub.pending_change) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
        <Calendar size={24} className="text-amber-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-amber-800">
          Pending plan change
        </h3>
        <p className="text-sm text-amber-700 mt-1">
          You already have a scheduled change on{" "}
          <span className="font-semibold">
            {new Date(sub.pending_change.effective_at).toLocaleDateString(
              "en-NG",
              { day: "numeric", month: "long", year: "numeric" },
            )}
          </span>
          . Cancel it before scheduling a new one.
        </p>
      </div>
    );
  }

  // ── Guard: already on lowest plan ──────────────────────
  if (downgradablePlans.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
        <ArrowDownCircle size={24} className="text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-700">
          You're on the lowest plan
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          There are no lower plans available to downgrade to.
        </p>
      </div>
    );
  }

  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "end of period";

  // ── Handlers ───────────────────────────────────────────

  const handleSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    if (confirming) {
      setConfirming(false);
      setConfirmed(false);
    }
  };

  const handleContinue = () => {
    if (!selectedPlan) return;
    setConfirming(true);
  };

  const handleBack = () => {
    setConfirming(false);
    setConfirmed(false);
  };

  const handleDowngrade = () => {
    if (!selectedPlan) return;
    downgrade.mutate(
      { new_plan: selectedPlan.name, billing_cycle: billingCycle },
      {
        onSuccess: () => {
          setSelectedPlan(null);
          setConfirming(false);
          setConfirmed(false);
        },
      },
    );
  };

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
            <ArrowDownCircle size={16} className="text-amber-600" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Downgrade plan</h2>
        </div>
        <p className="text-sm text-slate-500 ml-11">
          You're on{" "}
          <span className="font-semibold text-slate-700">
            {sub.plan_display_name}
          </span>
          . Downgrades take effect at the end of your billing period (
          {periodEnd}).
        </p>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
        <Info size={15} className="mt-0.5 shrink-0" />
        <p>
          You'll keep all current features until{" "}
          <span className="font-semibold">{periodEnd}</span>. After that, your
          account will switch to the selected plan. No refund is issued for the
          remaining period.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 sm:gap-3 text-sm">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            !confirming
              ? "bg-amber-600 text-white"
              : "bg-amber-100 text-amber-600"
          }`}
        >
          1
        </div>
        <span
          className={`text-xs sm:text-sm ${!confirming ? "font-semibold text-slate-800" : "text-slate-400"}`}
        >
          Choose a plan
        </span>
        <ChevronRight size={14} className="text-slate-300 shrink-0" />
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            confirming
              ? "bg-amber-600 text-white"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          2
        </div>
        <span
          className={`text-xs sm:text-sm ${confirming ? "font-semibold text-slate-800" : "text-slate-400"}`}
        >
          Confirm downgrade
        </span>
      </div>

      {/* ── STEP 1: Plan browser ── */}
      <div className={confirming ? "opacity-60 pointer-events-none" : ""}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <p className="text-sm text-slate-500">
            {downgradablePlans.length} plan
            {downgradablePlans.length !== 1 ? "s" : ""} available to downgrade
            to
          </p>
          <BillingCycleToggle value={billingCycle} onChange={setBillingCycle} />
        </div>

        {/*
          Wrap PlansGrid in a container that forces single-column on mobile.
          The `[&>*]:grid-cols-1` targets the grid inside PlansGrid and
          overrides it to 1 column below the `sm` breakpoint.
        */}
        <div className="[&>div]:grid-cols-1 [&>div]:sm:grid-cols-2 [&>div]:lg:grid-cols-3">
          <PlansGrid
            plans={downgradablePlans}
            billingCycle={billingCycle}
            currentPlan={sub}
            onSelect={handleSelect}
            isLoading={downgrade.isPending}
            actionLabel={(plan) =>
              selectedPlan?.id === plan.id ? "Selected ✓" : "Downgrade to this"
            }
            highlightIf={() => false}
          />
        </div>
      </div>

      {/* ── Continue CTA ── */}
      {selectedPlan && !confirming && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              {selectedPlan.name.charAt(0).toUpperCase() +
                selectedPlan.name.slice(1)}{" "}
              selected
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Ready to downgrade? Review the details in the next step.
            </p>
          </div>
          <button
            onClick={handleContinue}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700 transition-colors shrink-0"
          >
            Continue
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ── STEP 2: Confirm ── */}
      {confirming && selectedPlan && (
        <div className="bg-white border border-amber-200 rounded-2xl p-4 sm:p-6 shadow-sm shadow-amber-50 space-y-5">
          {/* Back + title */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ChevronLeft size={14} />
              Back
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Confirm downgrade
              </h3>
              <p className="text-xs text-slate-500">
                {sub.plan_display_name}
                {" → "}
                <span className="font-semibold text-slate-700">
                  {selectedPlan.name.charAt(0).toUpperCase() +
                    selectedPlan.name.slice(1)}
                </span>
              </p>
            </div>
          </div>

          {/* Effective date notice */}
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <div className="flex items-start gap-2.5">
              <Info size={14} className="text-amber-500 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-700 space-y-1">
                <p className="font-semibold">Scheduled change</p>
                <p>
                  Your plan will switch to{" "}
                  <span className="font-bold">
                    {selectedPlan.name.charAt(0).toUpperCase() +
                      selectedPlan.name.slice(1)}
                  </span>{" "}
                  on <span className="font-bold">{periodEnd}</span>. You'll
                  retain all current features until then.
                </p>
              </div>
            </div>
          </div>

          {/* Authorisation */}
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-amber-600"
            />
            <span className="text-xs text-slate-600">
              I understand the downgrade takes effect at the end of my billing
              period and some features may no longer be available after that.
            </span>
          </label>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDowngrade}
              disabled={!confirmed || downgrade.isPending}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700 disabled:opacity-60 transition-colors"
            >
              {downgrade.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ArrowDownCircle size={14} />
              )}
              Schedule downgrade
            </button>
            <button
              onClick={handleBack}
              className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
