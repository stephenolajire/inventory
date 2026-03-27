// src/pages/vendor/sales/components/SalesPaymentChart.tsx

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "../../../../lib/utils";
import type { SaleByPaymentMethod } from "../../../../types";

interface SalesPaymentChartProps {
  data: SaleByPaymentMethod[];
  isLoading: boolean;
}

const COLORS: Record<string, string> = {
  cash: "#0F6E56",
  card: "#3b82f6",
  transfer: "#C9A84C",
};

const LABELS: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  transfer: "Transfer",
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-bg-elevated border border-border rounded-xl shadow-lg px-3 py-2.5">
      <div className="text-xs font-semibold text-text-primary">
        {LABELS[d.payment_method] ?? d.payment_method}
      </div>
      <div className="text-xs text-text-muted mt-0.5">
        {formatCurrency(d.total_revenue)}
      </div>
      <div className="text-xs text-text-muted">
        {d.percentage.toFixed(1)}% · {d.total_sales} sales
      </div>
    </div>
  );
}

export function SalesPaymentChart({ data, isLoading }: SalesPaymentChartProps) {
  if (isLoading) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-5 animate-pulse">
        <div className="h-4 w-36 bg-bg-muted rounded-full mb-4" />
        <div className="flex items-center gap-4">
          <div className="w-28 h-28 rounded-full bg-bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 bg-bg-muted rounded-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-5 flex items-center justify-center min-h-[160px]">
        <p className="text-xs text-text-muted">No payment data yet</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    value: parseFloat(d.total_revenue),
  }));

  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5">
      <h3 className="font-heading font-bold text-sm text-text-primary mb-4">
        Payment breakdown
      </h3>

      <div className="flex items-center gap-4">
        <div className="w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                innerRadius={30}
                outerRadius={52}
                paddingAngle={3}
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.payment_method}
                    fill={COLORS[entry.payment_method] ?? "#888"}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2.5">
          {data.map((d) => (
            <div
              key={d.payment_method}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ background: COLORS[d.payment_method] ?? "#888" }}
                />
                <span className="text-xs text-text-secondary">
                  {LABELS[d.payment_method] ?? d.payment_method}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">
                  {d.percentage.toFixed(1)}%
                </span>
                <span className="text-xs font-semibold text-text-primary">
                  {formatCurrency(d.total_revenue)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
