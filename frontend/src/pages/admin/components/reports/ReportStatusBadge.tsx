// src/pages/admin/reports/components/ReportStatusBadge.tsx

import { cn } from "../../../../lib/utils";
import type { ReportStatus } from "../../../../types";

const STATUS_CLASSES: Record<ReportStatus, string> = {
  pending: "bg-bg-subtle    text-text-muted  border-border",
  generating: "bg-info-subtle  text-info        border-info-muted",
  ready: "bg-success-subtle text-success   border-success-muted",
  failed: "bg-error-subtle text-error       border-error-muted",
};

const STATUS_LABEL: Record<ReportStatus, string> = {
  pending: "Pending",
  generating: "Generating",
  ready: "Ready",
  failed: "Failed",
};

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border",
        STATUS_CLASSES[status] ?? "bg-bg-subtle text-text-muted border-border",
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
