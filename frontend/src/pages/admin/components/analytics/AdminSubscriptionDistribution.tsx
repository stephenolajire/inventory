// src/pages/admin/analytics/components/AdminSubscriptionDistribution.tsx

import { CreditCard } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { SubscriptionDistribution } from "../../../../types";

interface AdminSubscriptionDistributionProps {
  data: SubscriptionDistribution[];
  isLoading?: boolean;
}

// Assign a consistent accent per plan name
const PLAN_ACCENT: Record<string, string> = {
  Free: "bg-bg-muted text-text-muted",
  Basic: "bg-info-subtle text-info",
  Pro: "bg-primary-subtle text-primary",
  Enterprise: "bg-warning-subtle text-warning",
};

const PLAN_BAR: Record<string, string> = {
  Free: "bg-bg-muted",
  Basic: "bg-info",
  Pro: "bg-primary",
  Enterprise: "bg-warning",
};

function planAccent(plan: string) {
  return PLAN_ACCENT[plan] ?? "bg-success-subtle text-success";
}
function planBar(plan: string) {
  return PLAN_BAR[plan] ?? "bg-success";
}

export function AdminSubscriptionDistribution({
  data,
  isLoading,
}: AdminSubscriptionDistributionProps) {
  if (isLoading) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-5 animate-pulse">
        <div className="h-4 w-36 bg-bg-muted rounded-full mb-5" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-bg-muted rounded-full" />
                <div className="h-3 w-8 bg-bg-muted rounded-full" />
              </div>
              <div className="h-2 bg-bg-muted rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-5 flex flex-col items-center justify-center gap-2 min-h-40">
        <CreditCard size={24} className="text-text-muted opacity-40" />
        <span className="text-xs text-text-muted">No subscription data</span>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-5">
        <CreditCard size={14} className="text-primary" />
        <h3 className="font-heading font-bold text-sm text-text-primary">
          Subscription Plans
        </h3>
      </div>

      {/* Plan pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {data.map((d) => (
          <span
            key={d.plan}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold",
              planAccent(d.plan),
            )}
          >
            {d.plan}
            <span className="font-bold">{d.count}</span>
          </span>
        ))}
      </div>

      {/* Progress bars */}
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.plan}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-text-primary">
                {d.plan}
              </span>
              <span className="text-xs text-text-muted">{d.percentage}%</span>
            </div>
            <div className="h-2 rounded-full bg-bg-subtle overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  planBar(d.plan),
                )}
                style={{ width: `${d.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-text-muted mt-4 text-right">
        {total} active subscriptions
      </p>
    </div>
  );
}
