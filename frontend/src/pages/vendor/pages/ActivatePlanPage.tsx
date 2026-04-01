// src/pages/vendor/subscription/pages/ActivatePlanPage.tsx
import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useVendorSubscription } from "../../../hooks/vendor/useVendorSubscription";
import {
  Zap,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Package,
  BarChart2,
  FileText,
  GitBranch,
  CreditCard,
  Calendar,
  RefreshCw,
  XCircle,
} from "lucide-react";
import type { BillingCycle } from "../../../types";

function FeatureRow({
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
      className={`flex items-center gap-2.5 text-sm ${enabled ? "text-slate-700" : "text-slate-300"}`}
    >
      {enabled ? (
        <CheckCircle2 size={14} className="text-green-500 shrink-0" />
      ) : (
        <div className="w-3.5 h-3.5 rounded-full border border-slate-200 shrink-0" />
      )}
      <Icon size={13} className="shrink-0" />
      {label}
    </div>
  );
}

function formatCycle(cycle: BillingCycle) {
  return cycle === "yearly" ? "Annual" : "Monthly";
}

export default function ActivatePlanPage() {
  const stripe = useStripe();
  const elements = useElements();

  const [cardError, setCardError] = useState("");
  const [cardReady, setCardReady] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isCreatingPm, setCreating] = useState(false);

  const { subscription, selectPlan } = useVendorSubscription();
  const sub = subscription.data?.data;

  // ── Guard states ──

  if (subscription.isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 gap-2">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Loading your subscription…</span>
      </div>
    );
  }

  if (sub?.status === "active") {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={24} className="text-green-600" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          Plan already active
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Your{" "}
          <span className="font-semibold text-slate-700">
            {sub.plan_display_name}
          </span>{" "}
          plan is already running. Use Upgrade or Downgrade to change it.
        </p>
      </div>
    );
  }

  if (sub?.status === "pending_approval") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={24} className="text-amber-600" />
        </div>
        <h3 className="text-base font-bold text-amber-800">
          Awaiting admin approval
        </h3>
        <p className="text-sm text-amber-700 mt-2 leading-relaxed">
          Your account is pending review. Once approved, you'll be notified and
          can come back here to activate your plan.
        </p>
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package size={24} className="text-slate-400" />
        </div>
        <h3 className="text-base font-bold text-slate-700">
          No subscription found
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Please contact support — no pending subscription was found on your
          account.
        </p>
      </div>
    );
  }

  // ── Main handler ──

  const isFree = sub.plan_name === "free";

  const handleActivate = async () => {
    if (isFree) {
      selectPlan.mutate({
        plan: sub.plan_name,
        billing_cycle: sub.billing_cycle,
      });
      return;
    }

    if (!stripe || !elements) return;

    setCreating(true);
    setCardError("");

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    setCreating(false);

    if (error) {
      setCardError(error.message ?? "Card error. Please try again.");
      return;
    }

    selectPlan.mutate({
      plan: sub.plan_name,
      billing_cycle: sub.billing_cycle,
      stripe_payment_method_id: paymentMethod.id,
    } as any);
  };

  const canSubmit =
    confirmed &&
    !isCreatingPm &&
    !selectPlan.isPending &&
    (isFree || (!!stripe && cardReady));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-green-600" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Activate your plan
          </h2>
        </div>
        <p className="text-sm text-slate-500 ml-11">
          You chose this plan during registration. Review the details and
          confirm to get started.
        </p>
      </div>

      {/* Plan summary card */}
      <div className="bg-white border-2 border-green-200 rounded-2xl overflow-hidden shadow-sm shadow-green-50">
        <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-green-200 uppercase tracking-widest">
              Your selected plan
            </p>
            <h3 className="text-xl font-black text-white mt-0.5">
              {sub.plan_display_name}
            </h3>
          </div>
          <div className="text-right">
            {isFree ? (
              <p className="text-2xl font-black text-white">Free</p>
            ) : (
              <>
                <p className="text-2xl font-black text-white">
                  £{Number(sub.amount_paid).toLocaleString("en-NG")}
                </p>
                <p className="text-xs text-green-200">
                  {formatCycle(sub.billing_cycle)} billing · {sub.currency}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} /> {formatCycle(sub.billing_cycle)} billing
            </span>
            <span className="flex items-center gap-1.5">
              <RefreshCw size={13} /> Renews automatically
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <FeatureRow
              enabled={true}
              label={`${sub.product_limit.toLocaleString()} products`}
              icon={Package}
            />
            <FeatureRow
              enabled={sub.has_analytics}
              label="Analytics"
              icon={BarChart2}
            />
            <FeatureRow
              enabled={sub.has_reports}
              label="Reports"
              icon={FileText}
            />
            <FeatureRow enabled={false} label="Multi-branch" icon={GitBranch} />
          </div>
        </div>
      </div>

      {/* Stripe card input — only for paid plans */}
      {!isFree && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <CreditCard size={12} /> Card details
          </label>

          <div
            className={`px-4 py-3.5 bg-slate-50 border rounded-lg transition-all ${
              cardError
                ? "border-red-400"
                : "border-slate-200 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100"
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
      )}

      {/* Confirm + submit */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 accent-green-600"
          />
          <span className="text-xs text-slate-600">
            {isFree
              ? "I understand this is a free plan and I can upgrade at any time."
              : `I authorise a charge of £${Number(sub.amount_paid).toLocaleString("en-NG")} for the ${formatCycle(sub.billing_cycle).toLowerCase()} ${sub.plan_display_name} plan.`}
          </span>
        </label>

        <button
          onClick={handleActivate}
          disabled={!canSubmit}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
        >
          {isCreatingPm || selectPlan.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Zap size={16} />
          )}
          {isFree ? "Activate free plan" : "Pay & activate"}
        </button>
      </div>
    </div>
  );
}
