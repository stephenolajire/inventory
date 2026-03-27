// src/pages/admin/subscriptions/components/SubscriptionPlanCharts.tsx

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatCurrency, formatNumber } from "../../../../lib/utils";
import type { SubscriptionStats, RevenueStats } from "../../../../types";

// ─────────────────────────────────────────────────────────────
// Colours per plan
// ─────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  free: "var(--color-text-muted)",
  basic: "var(--color-info)",
  pro: "var(--color-primary)",
  enterprise: "var(--color-success)",
};

// ─────────────────────────────────────────────────────────────
// Plan distribution donut
// ─────────────────────────────────────────────────────────────

interface PlanDistributionProps {
  stats: SubscriptionStats | undefined;
  isLoading: boolean;
}

function PlanTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-bg-elevated border border-border rounded-xl shadow-lg px-4 py-3">
      <div className="text-xs text-text-muted capitalize mb-1">{d.plan}</div>
      <div className="font-heading font-bold text-text-primary text-sm">
        {formatNumber(d.count)} vendors
      </div>
    </div>
  );
}

export function PlanDistributionChart({
  stats,
  isLoading,
}: PlanDistributionProps) {
  const chartData = useMemo(() => stats?.by_plan ?? [], [stats]);
  const total = chartData.reduce((s, p) => s + p.count, 0);

  if (isLoading) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-5 animate-pulse">
        <div className="h-4 w-40 bg-bg-muted rounded-full mb-6" />
        <div className="h-40 bg-bg-muted rounded-full w-40 mx-auto" />
      </div>
    );
  }

  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5">
      <h3 className="font-heading font-bold text-sm text-text-primary mb-1">
        Plan Distribution
      </h3>
      <p className="text-xs text-text-muted mb-4">
        {formatNumber(total)} active subscriptions across all plans
      </p>

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
                dataKey="count"
                nameKey="plan"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.plan}
                    fill={PLAN_COLORS[entry.plan] ?? "var(--color-primary)"}
                  />
                ))}
              </Pie>
              <Tooltip content={<PlanTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="space-y-2 mt-2">
            {chartData.map((entry) => {
              const pct =
                total > 0 ? Math.round((entry.count / total) * 100) : 0;
              return (
                <div
                  key={entry.plan}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        background:
                          PLAN_COLORS[entry.plan] ?? "var(--color-primary)",
                      }}
                    />
                    <span className="capitalize text-text-muted">
                      {entry.plan}
                    </span>
                  </div>
                  <span className="font-semibold text-text-primary">
                    {formatNumber(entry.count)} · {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Revenue by plan bar chart
// ─────────────────────────────────────────────────────────────

interface RevenueByPlanProps {
  revenue: RevenueStats | undefined;
  isLoading: boolean;
}

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-bg-elevated border border-border rounded-xl shadow-lg px-4 py-3">
      <div className="text-xs text-text-muted capitalize mb-1">
        {label} plan
      </div>
      <div className="font-heading font-bold text-text-primary text-sm">
        {formatCurrency(payload[0].value)}
      </div>
      <div className="text-xs text-text-muted mt-0.5">
        {formatNumber(d.active_vendors)} active ·{" "}
        {formatNumber(d.payment_count)} payments
      </div>
    </div>
  );
}

export function RevenueByPlanChart({ revenue, isLoading }: RevenueByPlanProps) {
  const chartData = useMemo(
    () =>
      (revenue?.by_plan ?? []).map((p) => ({
        ...p,
        revenue: parseFloat(p.total_revenue),
      })),
    [revenue],
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
      <h3 className="font-heading font-bold text-sm text-text-primary mb-1">
        Revenue by Plan
      </h3>
      <p className="text-xs text-text-muted mb-5">
        Total subscription revenue per plan tier
      </p>

      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-text-muted">
          No revenue data yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={32}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="plan_name"
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `₦${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={<RevenueTooltip />}
              cursor={{ fill: "var(--color-bg-subtle)" }}
            />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.plan_name}
                  fill={PLAN_COLORS[entry.plan_name] ?? "var(--color-primary)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
