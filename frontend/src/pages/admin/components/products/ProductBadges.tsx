// src/pages/admin/products/components/ProductBadges.tsx

import { cn } from "../../../../lib/utils";
import type { ProcessingStatus } from "../../../../types";

// ─────────────────────────────────────────────────────────────
// Active / Inactive badge
// ─────────────────────────────────────────────────────────────

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border",
        active
          ? "bg-success-subtle text-success border-success-muted"
          : "bg-bg-subtle text-text-muted border-border",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Processing status badge
// ─────────────────────────────────────────────────────────────

const PROCESSING_CLASSES: Record<ProcessingStatus, string> = {
  processing: "bg-info-subtle text-info border-info-muted",
  active: "bg-success-subtle text-success border-success-muted",
  failed: "bg-error-subtle text-error border-error-muted",
};

const PROCESSING_LABEL: Record<ProcessingStatus, string> = {
  processing: "Processing",
  active: "Ready",
  failed: "Failed",
};

export function ProcessingBadge({ status }: { status: ProcessingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border",
        PROCESSING_CLASSES[status] ??
          "bg-bg-subtle text-text-muted border-border",
      )}
    >
      {PROCESSING_LABEL[status] ?? status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Stock level indicator
// ─────────────────────────────────────────────────────────────

export function StockLevel({
  quantity,
  isLow,
}: {
  quantity: number;
  isLow: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold",
        isLow ? "text-error" : "text-text-primary",
      )}
    >
      {isLow && (
        <span className="w-1.5 h-1.5 rounded-full bg-error inline-block" />
      )}
      {quantity.toLocaleString()}
    </span>
  );
}
