// src/pages/admin/vendors/analytics/components/VendorPaymentBreakdown.tsx

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "../../../../../../lib/utils";
import type { VendorAnalytics } from "../../../../../../types";

interface Props {
  data: VendorAnalytics["revenue"]["by_payment_method"] | undefined;
  isLoading: boolean;
}

const COLORS: Record<string, string> = {
  cash: "var(--color-success)",
  card: "var(--color-primary)",
  transfer: "var(--color-info)",
};

const FALLBACK_COLORS = [
  "var(--color-primary)",
  "var(--color-success)",
  "var(--color-info)",
  "var(--color-warning)",
];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-bg-elevated border border-border rounded-xl shadow-lg px-4 py-3">
      <div className="text-xs text-text-muted capitalize mb-1">
        {d.payment_method}
      </div>
      <div className="font-heading font-bold text-text-primary text-sm">
        {formatCurrency(d.revenue)}
      </div>
      <div className="text-xs text-text-muted mt-0.5">
        {d.count} transactions
      </div>
    </div>
  );
}

export function VendorPaymentBreakdown({ data, isLoading }: Props) {
  const chartData = useMemo(
    () =>
      (data ?? []).map((d) => ({
        ...d,
        revenue: parseFloat(String(d.revenue)),
      })),
    [data],
  );

  if (isLoading) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-5 animate-pulse">
        <div className="h-4 w-36 bg-bg-muted rounded-full mb-6" />
        <div className="h-40 bg-bg-muted rounded-full w-40 mx-auto" />
      </div>
    );
  }

  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5">
      <h3 className="font-heading font-bold text-sm text-text-primary mb-1">
        Payment Methods
      </h3>
      <p className="text-xs text-text-muted mb-4">Revenue by payment type</p>

      {chartData.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-sm text-text-muted">
          No data yet.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="revenue"
                nameKey="payment_method"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
              >
                {chartData.map((entry, i) => (
                  <Cell
                    key={entry.payment_method}
                    fill={
                      COLORS[entry.payment_method] ??
                      FALLBACK_COLORS[i % FALLBACK_COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="space-y-2 mt-2">
            {chartData.map((entry, i) => (
              <div
                key={entry.payment_method}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      background:
                        COLORS[entry.payment_method] ??
                        FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                    }}
                  />
                  <span className="capitalize text-text-muted">
                    {entry.payment_method}
                  </span>
                </div>
                <span className="font-semibold text-text-primary">
                  {formatCurrency(entry.revenue)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
