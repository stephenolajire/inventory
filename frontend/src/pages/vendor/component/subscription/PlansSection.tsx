// src/pages/vendor/subscription/sections/PlansSection.tsx
import {
  CheckCircle2,
  XCircle,
  Zap,
  BarChart2,
  FileText,
  Package,
} from "lucide-react";
import type {
  SubscriptionPlan,
  ActiveSubscription,
  BillingCycle,
} from "../../../../types";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const PLAN_ORDER = ["free", "basic", "pro", "enterprise"];

function sortPlans(plans: SubscriptionPlan[]): SubscriptionPlan[] {
  return [...plans].sort(
    (a, b) => PLAN_ORDER.indexOf(a.name) - PLAN_ORDER.indexOf(b.name),
  );
}

const PLAN_ACCENT: Record<
  string,
  { ring: string; badge: string; btn: string }
> = {
  free: {
    ring: "border-slate-200",
    badge: "bg-slate-100 text-slate-600",
    btn: "bg-slate-800 hover:bg-slate-900 text-white",
  },
  basic: {
    ring: "border-green-200",
    badge: "bg-green-100 text-green-700",
    btn: "bg-green-600 hover:bg-green-700 text-white",
  },
  pro: {
    ring: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    btn: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  enterprise: {
    ring: "border-purple-200",
    badge: "bg-purple-100 text-purple-700",
    btn: "bg-purple-600 hover:bg-purple-700 text-white",
  },
};

interface PlanFeature {
  label: string;
  enabled: boolean;
  icon: React.ElementType;
}

function getPlanFeatures(plan: SubscriptionPlan): PlanFeature[] {
  return [
    {
      label: `${plan.product_limit.toLocaleString()} products`,
      enabled: true,
      icon: Package,
    },
    { label: "Analytics", enabled: plan.has_analytics, icon: BarChart2 },
    { label: "Reports", enabled: plan.has_reports, icon: FileText },
    { label: "Multi-branch", enabled: plan.has_multi_branch, icon: Zap },
  ];
}

// ─────────────────────────────────────────────────────────────
// Plan card
// ─────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  currentPlan?: ActiveSubscription | null;
  onSelect: (plan: SubscriptionPlan) => void;
  isLoading?: boolean;
  actionLabel?: (plan: SubscriptionPlan, isCurrent: boolean) => string;
  disabledIf?: (plan: SubscriptionPlan) => boolean;
  highlightIf?: (plan: SubscriptionPlan) => boolean;
}

export function PlanCard({
  plan,
  billingCycle,
  currentPlan,
  onSelect,
  isLoading,
  actionLabel,
  disabledIf,
  highlightIf,
}: PlanCardProps) {
  const accent = PLAN_ACCENT[plan.name] ?? PLAN_ACCENT.basic;
  const isCurrent = currentPlan?.plan_name === plan.name;
  const isHighlighted = highlightIf?.(plan) ?? plan.name === "pro";
  const isDisabled = disabledIf?.(plan) ?? false;
  const price =
    billingCycle === "yearly" ? plan.yearly_price_gbp : plan.monthly_price_gbp;
  const features = getPlanFeatures(plan);

  const buttonLabel = actionLabel
    ? actionLabel(plan, isCurrent)
    : isCurrent
      ? "Current plan"
      : "Select plan";

  return (
    <div
      className={`relative bg-white rounded-2xl border-2 transition-all duration-200 flex flex-col ${
        isCurrent
          ? "border-green-400 shadow-sm shadow-green-100"
          : isHighlighted
            ? `${accent.ring} shadow-md`
            : "border-slate-200"
      } ${isDisabled ? "opacity-60" : ""}`}
    >
      {/* Popular badge */}
      {isHighlighted && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span
            className={`px-3 py-0.5 rounded-full text-xs font-bold ${accent.badge}`}
          >
            Most popular
          </span>
        </div>
      )}

      {/* Current plan indicator */}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-green-500 text-white">
            Current plan
          </span>
        </div>
      )}

      <div className="p-5 flex-1">
        {/* Plan name */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-600">
            {plan.name}
          </h3>
        </div>

        {/* Price */}
        <div className="mb-5">
          {plan.name === "free" ? (
            <p className="text-3xl font-black text-slate-900">Free</p>
          ) : (
            <>
              <p className="text-3xl font-black text-slate-900 tracking-tight">
                £{Number(price).toLocaleString("en-NG")}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                per {billingCycle === "yearly" ? "year" : "month"}
              </p>
              {billingCycle === "yearly" && (
                <p className="text-xs text-green-600 font-semibold mt-1">
                  ~£{Math.round(Number(price) / 12).toLocaleString("en-NG")}/mo{" "}
                  · save vs monthly
                </p>
              )}
            </>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-2 mb-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <li
                key={f.label}
                className={`flex items-center gap-2.5 text-xs ${
                  f.enabled ? "text-slate-700" : "text-slate-300"
                }`}
              >
                {f.enabled ? (
                  <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                ) : (
                  <XCircle size={13} className="text-slate-200 shrink-0" />
                )}
                <Icon size={12} className="shrink-0" />
                {f.label}
              </li>
            );
          })}
        </ul>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <button
          onClick={() => !isDisabled && !isCurrent && onSelect(plan)}
          disabled={isDisabled || isCurrent || isLoading}
          className={`w-full py-2.5 px-4 rounded-lg text-sm font-bold transition-all disabled:cursor-not-allowed ${
            isCurrent
              ? "bg-green-50 text-green-600 cursor-default"
              : isDisabled
                ? "bg-slate-100 text-slate-400"
                : accent.btn
          }`}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Plans grid
// ─────────────────────────────────────────────────────────────

interface PlansGridProps {
  plans: SubscriptionPlan[];
  billingCycle: BillingCycle;
  currentPlan?: ActiveSubscription | null;
  onSelect: (plan: SubscriptionPlan) => void;
  isLoading?: boolean;
  actionLabel?: (plan: SubscriptionPlan, isCurrent: boolean) => string;
  disabledIf?: (plan: SubscriptionPlan) => boolean;
  highlightIf?: (plan: SubscriptionPlan) => boolean;
}

export function PlansGrid({
  plans,
  billingCycle,
  currentPlan,
  onSelect,
  isLoading,
  actionLabel,
  disabledIf,
  highlightIf,
}: PlansGridProps) {
  const sorted = sortPlans(plans);
  return (
    <div className="grid grid-cols-2 gap-4">
      {sorted.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          billingCycle={billingCycle}
          currentPlan={currentPlan}
          onSelect={onSelect}
          isLoading={isLoading}
          actionLabel={actionLabel}
          disabledIf={disabledIf}
          highlightIf={highlightIf}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Billing cycle toggle — shared across pages
// ─────────────────────────────────────────────────────────────

interface BillingToggleProps {
  value: BillingCycle;
  onChange: (v: BillingCycle) => void;
}

export function BillingCycleToggle({ value, onChange }: BillingToggleProps) {
  return (
    <div className="inline-flex items-center bg-slate-100 rounded-lg p-1">
      {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => (
        <button
          key={cycle}
          onClick={() => onChange(cycle)}
          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all capitalize ${
            value === cycle
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {cycle}
          {cycle === "yearly" && (
            <span className="ml-1.5 text-green-600">Save</span>
          )}
        </button>
      ))}
    </div>
  );
}
