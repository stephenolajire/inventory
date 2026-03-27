// src/pages/vendor/sales/components/SalesStatCards.tsx

import { TrendingUp, ShoppingCart, Package, TrendingDown } from "lucide-react";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "../../../../lib/utils";
import { cn } from "../../../../lib/utils";
import type { SalesSummary } from "../../../../types";

interface SalesStatCardsProps {
  summary: SalesSummary | undefined;
  isLoading: boolean;
}

function StatCard({
  label,
  value,
  sub,
  icon,
  trend,
  isLoading,
  accent = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  trend?: number;
  isLoading: boolean;
  accent?: "default" | "success" | "warning" | "info";
}) {
  const accentMap = {
    default: "bg-bg-subtle text-text-muted border-border",
    success: "bg-success-subtle text-success border-success-muted",
    warning: "bg-warning-subtle text-warning border-warning-muted",
    info: "bg-info-subtle text-info border-info-muted",
  };

  if (isLoading) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-5 animate-pulse">
        <div className="h-3 w-20 bg-bg-muted rounded-full mb-4" />
        <div className="h-7 w-28 bg-bg-muted rounded-full mb-2" />
        <div className="h-3 w-16 bg-bg-muted rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5 hover:shadow-md hover:border-primary-muted transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
          {label}
        </span>
        <div
          className={cn(
            "w-9 h-9 rounded-xl border flex items-center justify-center",
            accentMap[accent],
          )}
        >
          {icon}
        </div>
      </div>
      <div className="font-heading font-extrabold text-2xl text-text-primary mb-1.5">
        {value}
      </div>
      <div className="flex items-center gap-2">
        {trend !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full",
              trend >= 0
                ? "bg-success-subtle text-success"
                : "bg-error-subtle text-error",
            )}
          >
            {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {formatPercent(trend)}
          </span>
        )}
        {sub && <span className="text-xs text-text-muted">{sub}</span>}
      </div>
    </div>
  );
}

export function SalesStatCards({ summary, isLoading }: SalesStatCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Today's revenue"
        value={formatCurrency(summary?.today.revenue ?? 0)}
        icon={<TrendingUp size={16} />}
        trend={summary?.month_vs_last_pct}
        sub="vs last month"
        isLoading={isLoading}
        accent="success"
      />
      <StatCard
        label="Today's orders"
        value={formatNumber(summary?.today.orders ?? 0)}
        icon={<ShoppingCart size={16} />}
        isLoading={isLoading}
        accent="info"
      />
      <StatCard
        label="This month"
        value={formatCurrency(summary?.this_month.revenue ?? 0)}
        sub={`${formatNumber(summary?.this_month.orders ?? 0)} orders`}
        icon={<TrendingUp size={16} />}
        isLoading={isLoading}
        accent="default"
      />
      <StatCard
        label="This week"
        value={formatCurrency(summary?.this_week.revenue ?? 0)}
        sub={`${formatNumber(summary?.this_week.orders ?? 0)} orders`}
        icon={<Package size={16} />}
        isLoading={isLoading}
        accent="warning"
      />
    </div>
  );
}
