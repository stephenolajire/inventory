// src/pages/vendor/subscription/pages/UpgradePlanPage.tsx
import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  useVendorSubscription,
  useProrationPreview,
} from "../../../hooks/vendor/useVendorSubscription";
import {
  PlansGrid,
  BillingCycleToggle,
} from "../component/subscription/PlansSection";
import type { SubscriptionPlan, BillingCycle } from "../../../types";
import {
  ArrowUpCircle,
  Loader2,
  AlertTriangle,
  CreditCard,
  Info,
  ChevronRight,
  ChevronLeft,
  XCircle,
} from "lucide-react";

export default function UpgradePlanPage() {
  const stripe = useStripe();
  const elements = useElements();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [cardError, setCardError] = useState("");
  const [cardReady, setCardReady] = useState(false);
  const [isCreatingPm, setIsCreatingPm] = useState(false);

  const { plans, subscription, upgrade } = useVendorSubscription();

  const sub = subscription.data?.data;

  const allPlans =
    ((plans.data as any)?.data as SubscriptionPlan[] | undefined) ?? [];

  const currentPlanObj = allPlans.find((p) => p.name === sub?.plan_name);
  const currentPrice = Number(currentPlanObj?.monthly_price_gbp ?? 0);

  const upgradablePlans = allPlans.filter(
    (p) => Number(p.monthly_price_gbp) > currentPrice,
  );

  const proration = useProrationPreview(
    selectedPlan?.name ?? "",
    billingCycle,
    { enabled: confirming && !!selectedPlan && !!sub },
  );

  const prorationData = proration.data?.data;

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
          You need an active subscription to upgrade.
        </p>
      </div>
    );
  }

  // ── Guard: already on highest plan ─────────────────────
  if (upgradablePlans.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
        <ArrowUpCircle size={24} className="text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-700">
          You're on the highest plan
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          There are no higher plans available to upgrade to.
        </p>
      </div>
    );
  }

  // ── Handlers ───────────────────────────────────────────

  const handleSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    if (confirming) {
      setConfirming(false);
      setCardError("");
      setCardReady(false);
      setConfirmed(false);
    }
  };

  const handleContinue = () => {
    if (!selectedPlan) return;
    setConfirming(true);
  };

  const handleBack = () => {
    setConfirming(false);
    setCardError("");
    setCardReady(false);
    setConfirmed(false);
  };

  const handleUpgrade = async () => {
    if (!selectedPlan || !stripe || !elements) return;

    setIsCreatingPm(true);
    setCardError("");

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    setIsCreatingPm(false);

    if (error) {
      setCardError(error.message ?? "Card error. Please try again.");
      return;
    }

    upgrade.mutate(
      {
        new_plan: selectedPlan.id,
        billing_cycle: billingCycle,
        stripe_payment_method_id: paymentMethod.id,
      },
      {
        onSuccess: () => {
          setSelectedPlan(null);
          setConfirming(false);
          setCardError("");
          setCardReady(false);
          setConfirmed(false);
        },
      },
    );
  };

  const canSubmit =
    confirmed && !isCreatingPm && !upgrade.isPending && !!stripe && cardReady;

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <ArrowUpCircle size={16} className="text-blue-600" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Upgrade plan</h2>
        </div>
        <p className="text-sm text-slate-500 ml-11">
          You're on{" "}
          <span className="font-semibold text-slate-700">
            {sub.plan_display_name}
          </span>
          . Browse the plans below, select one, then confirm to upgrade.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 text-sm">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            !confirming ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"
          }`}
        >
          1
        </div>
        <span
          className={
            !confirming ? "font-semibold text-slate-800" : "text-slate-400"
          }
        >
          Choose a plan
        </span>
        <ChevronRight size={14} className="text-slate-300" />
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            confirming
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          2
        </div>
        <span
          className={
            confirming ? "font-semibold text-slate-800" : "text-slate-400"
          }
        >
          Confirm &amp; pay
        </span>
      </div>

      {/* ── STEP 1: Plan browser (dimmed but always visible in step 2) ── */}
      <div className={confirming ? "opacity-60 pointer-events-none" : ""}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            {upgradablePlans.length} plan
            {upgradablePlans.length !== 1 ? "s" : ""} available to upgrade to
          </p>
          <BillingCycleToggle value={billingCycle} onChange={setBillingCycle} />
        </div>

        <PlansGrid
          plans={upgradablePlans}
          billingCycle={billingCycle}
          currentPlan={sub}
          onSelect={handleSelect}
          isLoading={upgrade.isPending}
          actionLabel={(plan) =>
            selectedPlan?.id === plan.id ? "Selected ✓" : "Select this plan"
          }
          highlightIf={(plan) => plan.name === "pro"}
        />
      </div>

      {/* ── Continue CTA: shown after selecting a plan, before step 2 ── */}
      {selectedPlan && !confirming && (
        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              {selectedPlan.name.charAt(0).toUpperCase() +
                selectedPlan.name.slice(1)}{" "}
              selected
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Ready to upgrade? Confirm payment details in the next step.
            </p>
          </div>
          <button
            onClick={handleContinue}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shrink-0"
          >
            Continue
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ── STEP 2: Confirm & pay ── */}
      {confirming && selectedPlan && (
        <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-sm shadow-blue-50 space-y-5">
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
                Confirm upgrade
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

          {/* Proration preview */}
          {proration.isLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Loader2 size={12} className="animate-spin" />
              Calculating prorated charge…
            </div>
          ) : prorationData ? (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-start gap-2.5">
                <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-700 space-y-1">
                  <p className="font-semibold">Prorated charge breakdown</p>
                  <p>
                    You'll be charged{" "}
                    <span className="font-bold">
                      £
                      {Number(prorationData.prorated_amount).toLocaleString(
                        "en-GB",
                      )}
                    </span>{" "}
                    today — the difference for the remaining days in your
                    current period.
                  </p>
                  <p className="opacity-70">
                    Effective {prorationData.effective_date}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Card details */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <CreditCard size={12} /> Card details
            </label>

            <div
              className={`px-4 py-3.5 bg-slate-50 border rounded-lg transition-all ${
                cardError
                  ? "border-red-400"
                  : "border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"
              }`}
            >
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "14px",
                      color: "#1e293b",
                      fontFamily: "'system-ui', sans-serif",
                      "::placeholder": { color: "#94a3b8" },
                    },
                    invalid: { color: "#ef4444" },
                  },
                  hidePostalCode: true,
                }}
                onChange={(e) => {
                  setCardReady(e.complete);
                  setCardError(e.error?.message ?? "");
                }}
              />
            </div>

            {cardError && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                <XCircle size={12} /> {cardError}
              </p>
            )}

            <p className="text-xs text-slate-400">
              Secured by Stripe. Your card details are never stored on our
              servers.
            </p>
          </div>

          {/* Authorisation */}
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-blue-600"
            />
            <span className="text-xs text-slate-600">
              I authorise this payment and understand the prorated charge.
            </span>
          </label>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleUpgrade}
              disabled={!canSubmit}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {isCreatingPm || upgrade.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ArrowUpCircle size={14} />
              )}
              Confirm upgrade
            </button>
            <button
              onClick={handleBack}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
