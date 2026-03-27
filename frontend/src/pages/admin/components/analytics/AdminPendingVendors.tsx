// src/pages/admin/analytics/components/AdminPendingVendors.tsx

import { Link } from "react-router-dom";
import { Clock, ArrowRight, CheckCircle } from "lucide-react";
import { ROUTES } from "../../../../constants/routes";
import { formatNumber } from "../../../../lib/utils";

interface AdminPendingVendorsProps {
  count: number;
  isLoading?: boolean;
}

export function AdminPendingVendors({
  count,
  isLoading,
}: AdminPendingVendorsProps) {
  if (isLoading) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-5 animate-pulse">
        <div className="h-4 w-32 bg-bg-muted rounded-full mb-4" />
        <div className="h-12 w-20 bg-bg-muted rounded-xl mx-auto mb-4" />
        <div className="h-8 bg-bg-muted rounded-xl" />
      </div>
    );
  }

  const hasPending = count > 0;

  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Clock
          size={14}
          className={hasPending ? "text-warning" : "text-success"}
        />
        <h3 className="font-heading font-bold text-sm text-text-primary">
          Pending Approvals
        </h3>
      </div>

      {hasPending ? (
        <>
          <div className="flex-1 flex flex-col items-center justify-center py-4 gap-1">
            <span className="font-heading font-extrabold text-4xl text-warning">
              {formatNumber(count)}
            </span>
            <span className="text-xs text-text-muted text-center">
              vendor{count !== 1 ? "s" : ""} waiting for approval
            </span>
          </div>

          <Link
            to={ROUTES.ADMIN_VENDORS ?? "/admin/vendors"}
            className="mt-auto inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-warning text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Review now
            <ArrowRight size={13} />
          </Link>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-6">
          <CheckCircle size={28} className="text-success opacity-70" />
          <span className="text-xs text-text-muted text-center">
            No pending approvals
          </span>
        </div>
      )}
    </div>
  );
}
