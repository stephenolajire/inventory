// src/pages/vendor/settings/components/SubscriptionSection.tsx

import { Link } from "react-router-dom";
import {
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useVendorSubscription } from "../../../../hooks/vendor/useVendor";
import {
  cn,
  formatDate,
  daysUntil,
  getPlanBadgeClass,
  toTitleCase,
  getStatusBadgeClass,
} from "../../../../lib/utils";
import { ROUTES } from "../../../../constants/routes";

export function SubscriptionSection() {
  const subQuery = useVendorSubscription();
  const sub = subQuery.data?.data;

  if (subQuery.isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 w-36 bg-bg-muted rounded-full" />
        <div className="h-40 bg-bg-muted rounded-2xl" />
      </div>
    );
  }

  const daysLeft = sub?.current_period_end
    ? daysUntil(sub.current_period_end)
    : null;
  const isExpiring = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h2 className="font-heading font-bold text-base text-text-primary mb-0.5">
          Subscription
        </h2>
        <p className="text-xs text-text-muted">
          Your current plan and billing details
        </p>
      </div>

      {!sub ? (
        <div className="text-center py-10">
          <p className="text-sm text-text-muted">No subscription data found</p>
        </div>
      ) : (
        <>
          {/* Plan card */}
          <div className="bg-bg-surface rounded-2xl border border-border overflow-hidden">
            {/* Plan header */}
            <div className="px-4 sm:px-5 py-4 border-b border-border">
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-primary-subtle border border-primary-muted flex items-center justify-center shrink-0">
                    <CreditCard size={16} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-bold text-text-primary capitalize">
                        {sub.plan_display_name}
                      </span>
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                          getPlanBadgeClass(sub.plan_name),
                        )}
                      >
                        {toTitleCase(sub.plan_name)}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 capitalize">
                      {sub.billing_cycle} billing · {sub.currency}
                    </p>
                  </div>
                </div>

                {/* Status badge — moves below on very small screens */}
                <span
                  className={cn(
                    "inline-flex shrink-0 px-2.5 py-1 rounded-xl text-[10px] font-semibold border",
                    getStatusBadgeClass(sub.status),
                  )}
                >
                  {toTitleCase(sub.status)}
                </span>
              </div>
            </div>

            {/* Plan features */}
            <div className="px-4 sm:px-5 py-4 space-y-2.5">
              {[
                {
                  label: "Products",
                  value:
                    sub.product_limit === -1
                      ? "Unlimited"
                      : `Up to ${sub.product_limit.toLocaleString()}`,
                },
                { label: "Analytics", value: sub.has_analytics, boolean: true },
                { label: "PDF Reports", value: sub.has_reports, boolean: true },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-xs text-text-muted">{f.label}</span>
                  {f.boolean ? (
                    f.value ? (
                      <CheckCircle2 size={14} className="text-success" />
                    ) : (
                      <span className="text-xs text-text-muted">
                        Not included
                      </span>
                    )
                  ) : (
                    <span className="text-xs font-semibold text-text-primary">
                      {f.value as string}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Billing period alert */}
            {sub.current_period_end && (
              <div className="px-4 sm:px-5 py-4 border-t border-border">
                <div
                  className={cn(
                    "flex items-start gap-2.5 p-3 rounded-xl",
                    isExpired
                      ? "bg-error-subtle   border border-error-muted"
                      : isExpiring
                        ? "bg-warning-subtle border border-warning-muted"
                        : "bg-bg-subtle       border border-border",
                  )}
                >
                  {isExpired || isExpiring ? (
                    <AlertCircle
                      size={14}
                      className={isExpired ? "text-error" : "text-warning"}
                    />
                  ) : (
                    <Clock size={14} className="text-text-muted" />
                  )}
                  <p
                    className={cn(
                      "text-xs leading-relaxed",
                      isExpired
                        ? "text-error"
                        : isExpiring
                          ? "text-warning"
                          : "text-text-muted",
                    )}
                  >
                    {isExpired
                      ? "Your subscription has expired"
                      : isExpiring
                        ? `Expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"} — ${formatDate(sub.current_period_end)}`
                        : `Renews on ${formatDate(sub.current_period_end)} · ${daysLeft} days remaining`}
                  </p>
                </div>
              </div>
            )}

            {/* Pending change */}
            {sub.pending_change && (
              <div className="px-4 sm:px-5 pb-4">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-warning-subtle border border-warning-muted">
                  <Clock size={14} className="text-warning shrink-0 mt-0.5" />
                  <p className="text-xs text-warning leading-relaxed">
                    {toTitleCase(sub.pending_change.change_type)} scheduled on{" "}
                    {formatDate(sub.pending_change.effective_at)}
                    {sub.pending_change.new_plan_name && (
                      <>
                        {" "}
                        →{" "}
                        <span className="font-semibold capitalize">
                          {sub.pending_change.new_plan_name}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Manage button */}
          <Link
            to={ROUTES.SUBSCRIPTION}
            className="
              w-full sm:w-auto
              inline-flex items-center justify-center gap-2
              px-5 py-2.5 rounded-xl
              bg-primary text-white text-sm font-semibold
              hover:bg-primary-hover shadow-sm
              transition-all duration-150 active:scale-95
            "
          >
            Manage subscription
            <ArrowRight size={14} />
          </Link>
        </>
      )}
    </div>
  );
}
