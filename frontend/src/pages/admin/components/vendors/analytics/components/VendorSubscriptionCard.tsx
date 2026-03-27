// src/pages/admin/vendors/analytics/components/VendorScannerSubscriptionCards.tsx

import { ScanLine, CreditCard } from "lucide-react";
import type { VendorAnalytics } from "../../../../../../types";
import { formatCurrency, formatDate } from "../../../../../../lib/utils";

interface Props {
  scanner: VendorAnalytics["scanner"] | undefined;
  subscription: VendorAnalytics["subscription"] | undefined;
  isLoading: boolean;
}

const SCANNER_STATUS_STYLES: Record<string, string> = {
  assigned: "bg-success/10 text-success",
  available: "bg-info/10    text-info",
  inactive: "bg-bg-muted   text-text-muted",
};

const SUB_STATUS_STYLES: Record<string, string> = {
  active: "bg-success/10  text-success",
  pending_payment: "bg-warning/10  text-warning",
  past_due: "bg-danger/10   text-danger",
  expired: "bg-bg-muted    text-text-muted",
  cancelled: "bg-bg-muted    text-text-muted",
};

function SkeletonCard() {
  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5 animate-pulse">
      <div className="h-4 w-28 bg-bg-muted rounded-full mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-3 bg-bg-muted rounded-full w-2/3" />
        ))}
      </div>
    </div>
  );
}

export function VendorScannerSubscriptionCards({
  scanner,
  subscription,
  isLoading,
}: Props) {
  if (isLoading) {
    return (
      <>
        <SkeletonCard />
        <SkeletonCard />
      </>
    );
  }

  return (
    <>
      {/* ── Scanner card ── */}
      <div className="bg-bg-surface rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <ScanLine size={15} className="text-primary" />
          <h3 className="font-heading font-bold text-sm text-text-primary">
            Assigned Scanner
          </h3>
        </div>

        {scanner ? (
          <div className="space-y-2.5">
            <div>
              <p className="text-xs text-text-muted">Serial Number</p>
              <p className="text-sm font-semibold text-text-primary font-mono">
                {scanner.serial_number}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Status</p>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize mt-0.5 ${SCANNER_STATUS_STYLES[scanner.status] ?? "bg-bg-muted text-text-muted"}`}
              >
                {scanner.status}
              </span>
            </div>
            {scanner.assigned_at && (
              <div>
                <p className="text-xs text-text-muted">Assigned On</p>
                <p className="text-sm text-text-primary">
                  {formatDate(scanner.assigned_at)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-text-muted">No scanner assigned yet.</p>
        )}
      </div>

      {/* ── Subscription card ── */}
      <div className="bg-bg-surface rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={15} className="text-primary" />
          <h3 className="font-heading font-bold text-sm text-text-primary">
            Subscription
          </h3>
        </div>

        {subscription ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">Plan</p>
                <p className="text-sm font-semibold text-text-primary capitalize">
                  {subscription.plan}
                </p>
              </div>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${SUB_STATUS_STYLES[subscription.status] ?? "bg-bg-muted text-text-muted"}`}
              >
                {subscription.status.replace(/_/g, " ")}
              </span>
            </div>
            <div>
              <p className="text-xs text-text-muted">Billing Cycle</p>
              <p className="text-sm text-text-primary capitalize">
                {subscription.billing_cycle}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Amount Paid</p>
              <p className="text-sm font-semibold text-text-primary">
                {formatCurrency(subscription.amount_paid)}
              </p>
            </div>
            {subscription.current_period_end && (
              <div>
                <p className="text-xs text-text-muted">Renews / Expires</p>
                <p className="text-sm text-text-primary">
                  {formatDate(subscription.current_period_end)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-text-muted">No active subscription.</p>
        )}
      </div>
    </>
  );
}
