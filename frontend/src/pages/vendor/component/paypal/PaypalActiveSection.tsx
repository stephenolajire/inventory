// src/pages/vendor/settings/paypal/components/PayPalActivateSection.tsx

import { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  Zap,
  ArrowRight,
  Loader2,
  AlertCircle,
  Star,
  ExternalLink,
} from "lucide-react";
import { cn } from "../../../../lib/utils";
import { useVendorPaypal } from "../../../../hooks/vendor/useVendorPaypal";
import { useVendorSubscription } from "../../../../hooks/vendor/useVendorSubscription";
import type { SubscriptionPlan } from "../../../../types";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function fmtPrice(price: string, cycle: "monthly" | "yearly"): string {
  const n = parseFloat(price);
  if (isNaN(n)) return price;
  return (
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n) + (cycle === "monthly" ? "/mo" : "/yr")
  );
}

const PLAN_BADGE: Record<string, { label: string; cls: string }> = {
  free: { label: "Free", cls: "badge-muted" },
  basic: { label: "Basic", cls: "badge-primary" },
  pro: { label: "Pro", cls: "badge-accent" },
  enterprise: { label: "Enterprise", cls: "badge-success" },
};

// ─────────────────────────────────────────────────────────────
// Popup helper
// ─────────────────────────────────────────────────────────────

function openPayPalPopup(url: string): Window | null {
  const width = 600;
  const height = 700;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  return window.open(
    url,
    "paypal_approval",
    `width=${width},height=${height},left=${left},top=${top},` +
      "scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no",
  );
}

// ─────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Choose plan" },
    { n: 2, label: "Confirm" },
    { n: 3, label: "Approve" },
  ];

  return (
    <div className="flex items-center gap-0 mb-5">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                step > s.n
                  ? "bg-primary text-white"
                  : step === s.n
                    ? "bg-primary text-white ring-2 ring-primary/30"
                    : "bg-bg-subtle text-text-muted",
              )}
            >
              {step > s.n ? <CheckCircle2 size={12} /> : s.n}
            </div>
            <span
              className={cn(
                "text-[10px] font-medium whitespace-nowrap",
                step === s.n ? "text-primary" : "text-text-muted",
              )}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "h-px w-10 sm:w-14 mx-1 mb-4 transition-all",
                step > s.n ? "bg-primary" : "bg-border",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Plan card
// ─────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  cycle,
  selected,
  current,
  onSelect,
}: {
  plan: SubscriptionPlan;
  cycle: "monthly" | "yearly";
  selected: boolean;
  current: boolean;
  onSelect: () => void;
}) {
  const badge = PLAN_BADGE[plan.name] ?? {
    label: plan.name,
    cls: "badge-muted",
  };
  const price =
    cycle === "yearly" ? plan.yearly_price_gbp : plan.monthly_price_gbp;
  const isPro = plan.name === "pro";

  return (
    <button
      onClick={onSelect}
      disabled={current}
      className={cn(
        "w-full text-left rounded-2xl border p-4 transition-all duration-150 relative",
        "focus-visible:ring-2 focus-visible:ring-primary/40",
        selected && !current
          ? "border-primary bg-primary-subtle shadow-brand-sm"
          : current
            ? "border-border bg-bg-subtle opacity-60 cursor-not-allowed"
            : "border-border bg-bg-surface hover:border-primary/40 hover:bg-primary-subtle/40",
      )}
    >
      {isPro && !current && (
        <span className="absolute -top-2 left-4 badge badge-accent text-[10px] px-2 py-0.5">
          <Star size={9} /> Popular
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full border-2 shrink-0 mt-0.5 transition-all",
              selected && !current
                ? "border-primary bg-primary"
                : "border-border-strong bg-transparent",
            )}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-text-primary capitalize">
                {plan.name}
              </span>
              <span className={cn("badge text-[10px]", badge.cls)}>
                {badge.label}
              </span>
              {current && (
                <span className="badge badge-muted text-[10px]">Current</span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {plan.product_limit === 0
                ? "Unlimited products"
                : `Up to ${plan.product_limit} products`}
              {plan.has_analytics && " · Analytics"}
              {plan.has_reports && " · Reports"}
              {plan.has_multi_branch && " · Multi-branch"}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-text-primary">
            {parseFloat(price) === 0 ? "Free" : fmtPrice(price, cycle)}
          </p>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Proration notice
// ─────────────────────────────────────────────────────────────

function ProrationNotice({
  isUpgrade,
  currentPlan,
  newPlan,
}: {
  isUpgrade: boolean;
  currentPlan: string;
  newPlan: string;
}) {
  if (!isUpgrade) return null;

  return (
    <div className="flex gap-2.5 p-3 rounded-xl bg-info-subtle border border-info/20 text-xs text-info">
      <AlertCircle size={14} className="shrink-0 mt-0.5" />
      <p>
        Upgrading from <strong className="capitalize">{currentPlan}</strong> to{" "}
        <strong className="capitalize">{newPlan}</strong> will charge a prorated
        amount for the remaining days in your current billing period.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Awaiting approval screen (popup opened)
// ─────────────────────────────────────────────────────────────

function AwaitingApprovalScreen({
  popupClosed,
  onReopenPopup,
  onDone,
}: {
  approvalUrl: string;
  popupClosed: boolean;
  onReopenPopup: () => void;
  onDone: () => void;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="flex flex-col items-center text-center gap-3 py-4">
        <div className="w-12 h-12 rounded-2xl bg-warning-subtle border border-warning/20 flex items-center justify-center">
          <AlertCircle size={22} className="text-warning" />
        </div>
        <div>
          <p className="text-sm font-bold text-text-primary">
            Waiting for PayPal approval
          </p>
          <p className="text-xs text-text-muted mt-1 max-w-xs">
            A PayPal window has opened. Complete the approval there — your plan
            will activate automatically once done.
          </p>
        </div>
      </div>

      {/* Pulsing waiting indicator */}
      {!popupClosed && (
        <div className="flex items-center justify-center gap-2 py-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-warning" />
          </span>
          <span className="text-xs text-text-muted">
            Waiting for approval in PayPal window…
          </span>
        </div>
      )}

      {/* Popup was closed without approving */}
      {popupClosed && (
        <div className="flex gap-2 p-3 rounded-xl bg-warning-subtle border border-warning/20 text-xs text-warning">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <p>
            The PayPal window was closed. Re-open it to complete approval, or
            come back later — your subscription is saved.
          </p>
        </div>
      )}

      <button onClick={onReopenPopup} className="btn btn-primary btn-md w-full">
        <ExternalLink size={14} />
        Re-open PayPal window
      </button>

      <button
        onClick={onDone}
        className="btn btn-ghost btn-sm w-full text-text-muted"
      >
        I'll approve later
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
  onDone: () => void;
}

export function PayPalActivateSection({ paypal, subscription, onDone }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [createError, setCreateError] = useState<string | null>(null);
  const [popupClosed, setPopupClosed] = useState(false);

  // Ref to the opened PayPal popup window
  const popupRef = useRef<Window | null>(null);

  // ✅ API returns { data: [...], success: true }
  const plans: SubscriptionPlan[] =
    (subscription.plans.data as any)?.data ?? [];
  const vendorSub = subscription.subscription.data?.data;
  const currentPlan = vendorSub?.plan_name ?? "free";

  const isUpgrade =
    selectedPlan &&
    vendorSub &&
    parseFloat(
      billingCycle === "yearly"
        ? selectedPlan.yearly_price_gbp
        : selectedPlan.monthly_price_gbp,
    ) >
      parseFloat(
        billingCycle === "yearly"
          ? (plans.find((p) => p.name === currentPlan)?.yearly_price_gbp ?? "0")
          : (plans.find((p) => p.name === currentPlan)?.monthly_price_gbp ??
              "0"),
      );

  // ── Typed reads from mutation data — no `as any` needed ──────────────────

  // approval_url lives at: ApiResponse<CreateSubscriptionResponse>.data.approval_url
  const subApprovalUrl = paypal.createSubscription.data?.data?.approval_url;

  // paypal_order_id for upgrade prorated charge
  const upgradeOrderId = (
    paypal.upgradeOrder.data?.data as { paypal_order_id?: string } | undefined
  )?.paypal_order_id;

  // ── Poll popup closed state ──────────────────────────────────────────────
  useEffect(() => {
    if (!subApprovalUrl || !popupRef.current) return;

    const interval = setInterval(() => {
      if (popupRef.current?.closed) {
        setPopupClosed(true);
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [subApprovalUrl]);

  // ── Open (or re-open) the PayPal popup ──────────────────────────────────
  function openPopup(url: string) {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus();
      return;
    }
    popupRef.current = openPayPalPopup(url);
    setPopupClosed(false);
  }

  // ── Step 2: create PayPal recurring subscription ──────────────────────────
  async function handleCreateSubscription() {
    if (!selectedPlan) return;
    setCreateError(null);

    try {
      // Upgrade flow — vendor already has an active subscription
      if (vendorSub?.status === "active" && isUpgrade) {
        const res = await paypal.upgradeOrder.mutateAsync({
          step: "create",
          new_plan: selectedPlan.id,
          billing_cycle: billingCycle,
        });
        // ✅ Typed: UpgradeCreateResponse has paypal_order_id
        const data = res.data as { paypal_order_id?: string } | undefined;
        if (data?.paypal_order_id) {
          const orderUrl = `https://www.paypal.com/checkoutnow?token=${data.paypal_order_id}`;
          popupRef.current = openPayPalPopup(orderUrl);
          setPopupClosed(false);
          setStep(3);
        }
        return;
      }

      // ✅ Recurring subscription — POST /api/paypal/subscriptions/create/
      const res = await paypal.createSubscription.mutateAsync({
        plan: selectedPlan.id,
        billing_cycle: billingCycle,
        currency: "NGN",
      });

      // ✅ Fully typed — no `as any` needed
      const approvalUrl = res.data?.approval_url;
      if (approvalUrl) {
        openPopup(approvalUrl);
      }

      setStep(3);
    } catch {
      setCreateError("Could not create PayPal subscription. Please try again.");
    }
  }

  // ── Step 3: capture upgrade order (upgrade flow only) ────────────────────
  async function handleCaptureUpgrade() {
    if (!upgradeOrderId) return;
    setCreateError(null);

    try {
      await paypal.upgradeOrder.mutateAsync({
        step: "capture",
        paypal_order_id: upgradeOrderId,
      });
      onDone();
    } catch {
      setCreateError(
        "Capture failed. Make sure you've approved the payment on PayPal, then try again.",
      );
    }
  }

  const isPending =
    paypal.createSubscription.isPending || paypal.upgradeOrder.isPending;

  // ── Render approval waiting screen (recurring sub flow) ──────────────────
  if (subApprovalUrl && step === 3 && !upgradeOrderId) {
    return (
      <AwaitingApprovalScreen
        approvalUrl={subApprovalUrl}
        popupClosed={popupClosed}
        onReopenPopup={() => openPopup(subApprovalUrl)}
        onDone={onDone}
      />
    );
  }

  return (
    <div className="space-y-5 mb-5">
      <StepIndicator step={step} />

      {/* ══════════════════════════════
          STEP 1 — Choose plan
      ══════════════════════════════ */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Billing toggle */}
          <div className="flex mt-5 items-center gap-1 p-1 bg-bg-subtle rounded-xl w-fit">
            {(["monthly", "yearly"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setBillingCycle(c)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize",
                  billingCycle === c
                    ? "bg-bg-surface text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-primary",
                )}
              >
                {c}
                {c === "yearly" && (
                  <span className="ml-1 text-[9px] text-success font-bold">
                    Save ~17%
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Plan list */}
          <div className="space-y-2">
            {plans
              .filter((p) => p.name !== "free")
              .map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  cycle={billingCycle}
                  selected={selectedPlan?.id === plan.id}
                  current={plan.name === currentPlan}
                  onSelect={() => setSelectedPlan(plan)}
                />
              ))}
          </div>

          <button
            disabled={!selectedPlan || isPending}
            onClick={() => setStep(2)}
            className="btn btn-primary btn-md w-full mt-2"
          >
            Continue
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ══════════════════════════════
          STEP 2 — Confirm + create
      ══════════════════════════════ */}
      {step === 2 && selectedPlan && (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="bg-bg-subtle rounded-2xl p-4 space-y-2.5">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Order summary
            </p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">Plan</p>
              <p className="text-sm font-semibold text-text-primary capitalize">
                {selectedPlan.name}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">Billing cycle</p>
              <p className="text-sm font-semibold text-text-primary capitalize">
                {billingCycle}
              </p>
            </div>
            <div className="border-t border-border pt-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">
                {isUpgrade ? "Prorated charge" : "Amount"}
              </p>
              <p className="text-sm font-bold text-primary">
                {new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                }).format(
                  parseFloat(
                    billingCycle === "yearly"
                      ? selectedPlan.yearly_price_gbp
                      : selectedPlan.monthly_price_gbp,
                  ),
                )}
              </p>
            </div>
          </div>

          <ProrationNotice
            isUpgrade={!!isUpgrade}
            currentPlan={currentPlan}
            newPlan={selectedPlan.name}
          />

          {/* PayPal branding notice */}
          <div className="flex gap-2 p-3 rounded-xl bg-[#FFC43926] border border-[#FFC439]/30 text-xs text-text-secondary">
            <Zap size={14} className="text-[#003087] shrink-0 mt-0.5" />
            <p>
              A <strong>PayPal</strong> window will open for you to approve your
              recurring subscription. Your plan activates automatically once
              approved.
            </p>
          </div>

          {createError && (
            <div className="flex gap-2 p-3 rounded-xl bg-error-subtle border border-error/20 text-xs text-error">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              {createError}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="btn btn-surface btn-sm flex-1"
            >
              Back
            </button>
            <button
              disabled={isPending}
              onClick={handleCreateSubscription}
              className="btn btn-primary btn-sm flex-1"
            >
              {isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Setting up…
                </>
              ) : (
                <>
                  <Zap size={13} />
                  Subscribe with PayPal
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          STEP 3 — Upgrade capture only
          (recurring sub shows
          AwaitingApprovalScreen above)
      ══════════════════════════════ */}
      {step === 3 && upgradeOrderId && (
        <div className="space-y-4">
          <div className="bg-warning-subtle border border-warning/20 rounded-2xl p-4 space-y-2">
            <p className="text-sm font-semibold text-text-primary">
              Complete upgrade payment on PayPal
            </p>
            <p className="text-xs text-text-secondary">
              A PayPal window has opened for the prorated upgrade charge.
              Complete the payment there, then click{" "}
              <strong>"I've paid on PayPal"</strong> below.
            </p>
            <p className="text-xs text-text-muted font-mono bg-bg-surface border border-border rounded-lg px-2 py-1 mt-1 break-all">
              Order: {upgradeOrderId}
            </p>
          </div>

          {createError && (
            <div className="flex gap-2 p-3 rounded-xl bg-error-subtle border border-error/20 text-xs text-error">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              {createError}
            </div>
          )}

          <button
            disabled={isPending}
            onClick={handleCaptureUpgrade}
            className="btn btn-primary btn-md w-full"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Verifying payment…
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                I've paid on PayPal
              </>
            )}
          </button>

          <button
            onClick={() => setStep(1)}
            className="btn btn-ghost btn-sm w-full text-text-muted"
          >
            Start over
          </button>
        </div>
      )}
    </div>
  );
}
