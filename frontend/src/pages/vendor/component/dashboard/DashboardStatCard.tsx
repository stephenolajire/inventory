// src/pages/vendor/dashboard/components/DashboardStatCard.tsx

import { type ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "../../../../lib/utils";

interface DashboardStatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: number;
  subLabel?: string;
  isLoading?: boolean;
  accent?: "primary" | "success" | "warning" | "error" | "info";
}

export function DashboardStatCard({
  label,
  value,
  icon,
  trend,
  subLabel,
  isLoading,
  accent = "primary",
}: DashboardStatCardProps) {
  const accentMap = {
    primary: "bg-primary-subtle text-primary border-primary-muted",
    success: "bg-success-subtle text-success border-success-muted",
    warning: "bg-warning-subtle text-warning border-warning-muted",
    error: "bg-error-subtle   text-error   border-error-muted",
    info: "bg-info-subtle    text-info     border-info-muted",
  };

  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;
  const trendFlat = trend !== undefined && trend === 0;

  if (isLoading) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-5 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-24 bg-bg-muted rounded-full" />
          <div className="w-9 h-9 rounded-xl bg-bg-muted" />
        </div>
        <div className="h-7 w-32 bg-bg-muted rounded-full mb-2" />
        <div className="h-3 w-20 bg-bg-muted rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5 hover:shadow-md hover:border-primary-muted transition-all duration-200">
      {/* Header */}
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

      {/* Value */}
      <div className="font-heading font-extrabold text-2xl text-text-primary mb-1.5">
        {value}
      </div>

      {/* Trend + subLabel */}
      <div className="flex items-center gap-2">
        {trend !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full",
              trendPositive && "bg-success-subtle text-success",
              trendNegative && "bg-error-subtle   text-error",
              trendFlat && "bg-bg-subtle       text-text-muted",
            )}
          >
            {trendPositive && <TrendingUp size={10} />}
            {trendNegative && <TrendingDown size={10} />}
            {trendFlat && <Minus size={10} />}
            {trendPositive ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
        )}
        {subLabel && (
          <span className="text-xs text-text-muted">{subLabel}</span>
        )}
      </div>
    </div>
  );
}
