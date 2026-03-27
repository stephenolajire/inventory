// src/pages/admin/vendors/analytics/components/VendorCategoryBreakdown.tsx

import { LayoutGrid } from "lucide-react";
import type { VendorAnalytics } from "../../../../../../types";

interface Props {
  data: VendorAnalytics["products"]["by_category"] | undefined;
  isLoading: boolean;
}

export function VendorCategoryBreakdown({ data, isLoading }: Props) {
  const total = (data ?? []).reduce((sum, c) => sum + c.count, 0);

  if (isLoading) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-5 animate-pulse">
        <div className="h-4 w-36 bg-bg-muted rounded-full mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 bg-bg-muted rounded-full w-2/3" />
              <div className="h-2 bg-bg-muted rounded-full w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <LayoutGrid size={15} className="text-primary" />
        <h3 className="font-heading font-bold text-sm text-text-primary">
          Products by Category
        </h3>
      </div>

      {!data?.length ? (
        <p className="text-sm text-text-muted">No products yet.</p>
      ) : (
        <div className="space-y-3">
          {data.map((cat) => {
            const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
            return (
              <div key={cat.category_name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-primary font-medium">
                    {cat.category_name}
                  </span>
                  <span className="text-xs text-text-muted">
                    {cat.count} · {pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
