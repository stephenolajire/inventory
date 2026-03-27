// src/pages/admin/vendors/analytics/components/VendorMonthlyRevenueChart.tsx

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "../../../../../../lib/utils";
import type { VendorAnalytics } from "../../../../../../types";

interface Props {
  data: VendorAnalytics["monthly_breakdown"];
  isLoading: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elevated border border-border rounded-xl shadow-lg px-4 py-3">
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className="font-heading font-bold text-text-primary text-sm">
        {formatCurrency(payload[0].value)}
      </div>
      <div className="text-xs text-text-muted mt-0.5">
        {payload[0].payload.transactions} transactions ·{" "}
        {payload[0].payload.items_sold} items
      </div>
    </div>
  );
}

export function VendorMonthlyRevenueChart({ data, isLoading }: Props) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        month: d.month.slice(0, 7),
        revenue: parseFloat(String(d.revenue)),
      })),
    [data],
  );

  if (isLoading) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-5 animate-pulse">
        <div className="h-4 w-40 bg-bg-muted rounded-full mb-6" />
        <div className="h-48 bg-bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-heading font-bold text-sm text-text-primary">
            Monthly Revenue
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Last {data.length} months
          </p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-text-muted">
          No sales recorded yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={24}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `₦${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "var(--color-bg-subtle)" }}
            />
            <Bar
              dataKey="revenue"
              fill="var(--color-primary)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
