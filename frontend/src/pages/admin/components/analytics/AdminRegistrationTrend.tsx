// src/pages/admin/analytics/components/AdminRegistrationTrend.tsx

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users } from "lucide-react";
import type { VendorRegistrationTrend } from "../../../../types";

interface AdminRegistrationTrendProps {
  data: VendorRegistrationTrend[];
  isLoading?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elevated border border-border rounded-xl shadow-lg px-4 py-3">
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className="font-heading font-bold text-text-primary text-sm">
        {payload[0].value} new vendors
      </div>
    </div>
  );
}

export function AdminRegistrationTrend({
  data,
  isLoading,
}: AdminRegistrationTrendProps) {
  const chartData = useMemo(
    () => data.map((d) => ({ ...d, month: d.month.slice(0, 7) })),
    [data],
  );

  if (isLoading) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-5 animate-pulse">
        <div className="h-4 w-44 bg-bg-muted rounded-full mb-6" />
        <div className="h-36 bg-bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-5">
        <Users size={14} className="text-success" />
        <div>
          <h3 className="font-heading font-bold text-sm text-text-primary">
            Vendor Registrations
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            New vendors per month · last {data.length} months
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-success)"
                stopOpacity={0.2}
              />
              <stop
                offset="95%"
                stopColor="var(--color-success)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
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
            allowDecimals={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "var(--color-border)" }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--color-success)"
            strokeWidth={2}
            fill="url(#regGradient)"
            dot={{ r: 3, fill: "var(--color-success)", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "var(--color-success)", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
