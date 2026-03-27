// src/pages/admin/analytics/components/AdminTopVendors.tsx

import { Link } from "react-router-dom";
import { ArrowRight, Trophy } from "lucide-react";
import { formatCurrency, formatNumber } from "../../../../lib/utils";
import { ROUTES } from "../../../../constants/routes";
import type { TopVendor } from "../../../../types";

interface AdminTopVendorsProps {
  data: TopVendor[];
  isLoading?: boolean;
}

const MEDAL: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

export function AdminTopVendors({ data, isLoading }: AdminTopVendorsProps) {
  if (isLoading) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-5 animate-pulse">
        <div className="h-4 w-32 bg-bg-muted rounded-full mb-5" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-bg-subtle"
            >
              <div className="w-7 h-7 rounded-full bg-bg-muted shrink-0" />
              <div className="flex-1 h-3 bg-bg-muted rounded-full" />
              <div className="w-20 h-3 bg-bg-muted rounded-full" />
              <div className="w-14 h-3 bg-bg-muted rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-5 flex flex-col items-center justify-center gap-2 min-h-40">
        <Trophy size={24} className="text-text-muted opacity-40" />
        <span className="text-xs text-text-muted">No vendor data yet</span>
      </div>
    );
  }

  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-warning" />
          <h3 className="font-heading font-bold text-sm text-text-primary">
            Top Vendors by Revenue
          </h3>
        </div>
        <Link
          to={ROUTES.ADMIN_VENDORS ?? "/admin/vendors"}
          className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
        >
          View all
          <ArrowRight size={11} />
        </Link>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-12 gap-2 px-3 mb-2">
        <span className="col-span-5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
          Vendor
        </span>
        <span className="col-span-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider text-right">
          Revenue
        </span>
        <span className="col-span-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider text-right">
          Orders
        </span>
        <span className="col-span-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider text-right">
          Units
        </span>
      </div>

      <div className="space-y-1.5">
        {data.map((vendor, i) => (
          <div
            key={vendor.vendor_id}
            className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-xl bg-bg-subtle hover:bg-bg-muted transition-colors duration-100"
          >
            {/* Rank + email */}
            <div className="col-span-5 flex items-center gap-2 min-w-0">
              <span className="text-sm shrink-0">
                {MEDAL[i] ?? (
                  <span className="text-xs font-bold text-text-muted w-5 text-center inline-block">
                    {i + 1}
                  </span>
                )}
              </span>
              <span className="text-xs font-medium text-text-primary truncate">
                {vendor.vendor_email}
              </span>
            </div>

            {/* Revenue */}
            <span className="col-span-3 text-xs font-bold text-text-primary text-right">
              {formatCurrency(vendor.total_revenue)}
            </span>

            {/* Orders */}
            <span className="col-span-2 text-xs text-text-muted text-right">
              {formatNumber(vendor.total_orders)}
            </span>

            {/* Units */}
            <span className="col-span-2 text-xs text-text-muted text-right">
              {formatNumber(vendor.total_units)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
