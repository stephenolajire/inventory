// src/pages/admin/vendors/analytics/components/VendorTopProducts.tsx

import { Trophy } from "lucide-react";
import { formatCurrency, formatNumber } from "../../../../../../lib/utils";
import type { VendorAnalytics } from "../../../../../../types";

interface TopByUnitsProps {
  data: VendorAnalytics["products"]["top_by_units"] | undefined;
  isLoading: boolean;
}

interface TopByRevenueProps {
  data: VendorAnalytics["revenue"]["top_by_revenue"] | undefined;
  isLoading: boolean;
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="h-3 bg-bg-muted rounded-full flex-1" />
          <div className="h-3 bg-bg-muted rounded-full w-16" />
        </div>
      ))}
    </div>
  );
}

const RANK_COLORS = [
  "text-yellow-500",
  "text-slate-400",
  "text-amber-600",
  "text-text-muted",
  "text-text-muted",
];

export function VendorTopProductsByUnits({ data, isLoading }: TopByUnitsProps) {
  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={15} className="text-primary" />
        <h3 className="font-heading font-bold text-sm text-text-primary">
          Top Products · Units Sold
        </h3>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : !data?.length ? (
        <p className="text-sm text-text-muted">No data yet.</p>
      ) : (
        <div className="space-y-2.5">
          {data.map((p, i) => (
            <div
              key={p.name}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`text-xs font-bold w-4 text-center shrink-0 ${RANK_COLORS[i] ?? "text-text-muted"}`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatCurrency(p.selling_price)} · stock:{" "}
                    {formatNumber(p.quantity_in_stock)}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-text-primary shrink-0">
                {formatNumber(p.total_sold)} sold
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function VendorTopProductsByRevenue({
  data,
  isLoading,
}: TopByRevenueProps) {
  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={15} className="text-success" />
        <h3 className="font-heading font-bold text-sm text-text-primary">
          Top Products · Revenue
        </h3>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : !data?.length ? (
        <p className="text-sm text-text-muted">No data yet.</p>
      ) : (
        <div className="space-y-2.5">
          {data.map((p, i) => (
            <div
              key={p.product_name}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`text-xs font-bold w-4 text-center shrink-0 ${RANK_COLORS[i] ?? "text-text-muted"}`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {p.product_name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatNumber(p.units_sold)} units · {p.transactions} txns
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-success shrink-0">
                {formatCurrency(p.revenue)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
