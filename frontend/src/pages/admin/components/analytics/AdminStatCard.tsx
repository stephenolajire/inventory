// src/pages/admin/analytics/components/AdminStatCard.tsx

import type { ReactNode } from "react";
import { cn } from "../../../../lib/utils";

type Accent = "primary" | "success" | "info" | "warning" | "error";

interface AdminStatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  isLoading?: boolean;
  accent?: Accent;
  /** Compact variant — shorter padding for the secondary strip */
  compact?: boolean;
}

const accentMap: Record<Accent, { icon: string; bg: string }> = {
  primary: { icon: "text-primary", bg: "bg-primary-subtle" },
  success: { icon: "text-success", bg: "bg-success-subtle" },
  info: { icon: "text-info", bg: "bg-info-subtle" },
  warning: { icon: "text-warning", bg: "bg-warning-subtle" },
  error: { icon: "text-error", bg: "bg-error-subtle" },
};

export function AdminStatCard({
  label,
  value,
  icon,
  isLoading,
  accent = "primary",
  compact = false,
}: AdminStatCardProps) {
  const { icon: iconColor, bg } = accentMap[accent];

  if (isLoading) {
    return (
      <div
        className={cn(
          "bg-bg-surface rounded-2xl border border-border animate-pulse",
          compact ? "p-4" : "p-5",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-bg-muted shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 bg-bg-muted rounded-full" />
            <div className="h-5 w-20 bg-bg-muted rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-bg-surface rounded-2xl border border-border",
        compact ? "p-4" : "p-5",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
            bg,
            iconColor,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-text-muted truncate">{label}</p>
          <p className="font-heading font-extrabold text-base text-text-primary leading-tight mt-0.5 truncate">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
