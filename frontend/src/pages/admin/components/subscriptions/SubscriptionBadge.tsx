// src/pages/admin/subscriptions/components/SubscriptionBadges.tsx

import type { SubscriptionStatus, PlanName } from "../../../../types";

// ─────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  active: "bg-success/10  text-success",
  pending_approval: "bg-info/10     text-info",
  pending_payment: "bg-warning/10  text-warning",
  past_due: "bg-danger/10   text-danger",
  expired: "bg-bg-muted    text-text-muted",
  cancelled: "bg-bg-muted    text-text-muted",
};

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "Active",
  pending_approval: "Pending Approval",
  pending_payment: "Pending Payment",
  past_due: "Past Due",
  expired: "Expired",
  cancelled: "Cancelled",
};

export function SubscriptionStatusBadge({
  status,
}: {
  status: SubscriptionStatus;
}) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[status] ?? "bg-bg-muted text-text-muted"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Plan badge
// ─────────────────────────────────────────────────────────────

const PLAN_STYLES: Record<PlanName, string> = {
  free: "bg-bg-muted   text-text-muted",
  basic: "bg-info/10    text-info",
  pro: "bg-primary/10 text-primary",
  enterprise: "bg-success/10 text-success",
};

export function PlanBadge({ plan }: { plan: PlanName }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${PLAN_STYLES[plan] ?? "bg-bg-muted text-text-muted"}`}
    >
      {plan}
    </span>
  );
}
