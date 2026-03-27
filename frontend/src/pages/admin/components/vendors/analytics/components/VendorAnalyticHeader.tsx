// src/pages/admin/vendors/analytics/components/VendorAnalyticsHeader.tsx

import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart2 } from "lucide-react";

interface VendorAnalyticsHeaderProps {
  businessName?: string;
  email?: string;
  status?: string;
  isLoading?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-success/10 text-success",
  suspended: "bg-warning/10 text-warning",
  rejected: "bg-danger/10  text-danger",
  pending_approval: "bg-info/10 text-info",
  pending_verification: "bg-info/10 text-info",
};

export function VendorAnalyticsHeader({
  businessName,
  email,
  status,
  isLoading,
}: VendorAnalyticsHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Left — back + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border border-border bg-bg-surface hover:bg-bg-subtle transition-colors"
        >
          <ArrowLeft size={16} className="text-text-muted" />
        </button>

        {isLoading ? (
          <div className="animate-pulse space-y-1.5">
            <div className="h-4 w-36 bg-bg-muted rounded-full" />
            <div className="h-6 w-52 bg-bg-muted rounded-full" />
          </div>
        ) : (
          <div>
            <p className="text-sm text-text-muted flex items-center gap-1.5">
              {email}
              {status && (
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[status] ?? "bg-bg-muted text-text-muted"}`}
                >
                  {status.replace(/_/g, " ")}
                </span>
              )}
            </p>
            <h1 className="font-heading font-extrabold text-xl text-text-primary mt-0.5">
              {businessName ?? "Vendor Analytics"}
            </h1>
          </div>
        )}
      </div>

      {/* Right — badge */}
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-subtle border border-border text-xs font-semibold text-text-muted">
        <BarChart2 size={14} className="text-primary" />
        Vendor Analytics
      </div>
    </div>
  );
}
