// src/pages/admin/vendors/components/VendorStatusBadge.tsx

import { cn } from "../../../../lib/utils";

interface VendorStatusBadgeProps {
  status?: string;
  isProfileComplete?: boolean;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  approved: {
    label: "Approved",
    className: "bg-success-subtle text-success",
  },
  pending_approval: {
    label: "Pending",
    className: "bg-warning-subtle text-warning",
  },
  pending_verification: {
    label: "Unverified",
    className: "bg-info-subtle text-info",
  },
  rejected: {
    label: "Rejected",
    className: "bg-error-subtle text-error",
  },
  suspended: {
    label: "Suspended",
    className: "bg-bg-muted text-text-muted",
  },
};

export function VendorStatusBadge({
  status,
  isProfileComplete,
}: VendorStatusBadgeProps) {
  const config = status
    ? (STATUS_MAP[status] ?? {
        label: status,
        className: "bg-bg-muted text-text-muted",
      })
    : isProfileComplete
      ? STATUS_MAP["approved"]
      : STATUS_MAP["pending_approval"];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
