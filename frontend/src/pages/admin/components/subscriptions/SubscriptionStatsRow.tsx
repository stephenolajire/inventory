// src/pages/admin/subscriptions/components/SubscriptionStatsRow.tsx

import {
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Users,
} from "lucide-react";
import { AdminStatCard } from "../../components/analytics/AdminStatCard";
import { formatNumber, formatCurrency } from "../../../../lib/utils";
import type { SubscriptionStats, RevenueStats } from "../../../../types";

interface Props {
  stats: SubscriptionStats | undefined;
  revenue: RevenueStats | undefined;
  isLoading: boolean;
  revenueLoading: boolean;
}

export function SubscriptionStatsRow({
  stats,
  revenue,
  isLoading,
  revenueLoading,
}: Props) {
  return (
    <div className="space-y-3">
      {/* Row 1 — subscription counts */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <AdminStatCard
          label="Total Subscriptions"
          value={formatNumber(stats?.total ?? 0)}
          icon={<CreditCard size={16} />}
          isLoading={isLoading}
          accent="primary"
        />
        <AdminStatCard
          label="Active"
          value={formatNumber(stats?.active ?? 0)}
          icon={<CheckCircle size={16} />}
          isLoading={isLoading}
          accent="success"
        />
        <AdminStatCard
          label="Pending"
          value={formatNumber(stats?.pending ?? 0)}
          icon={<Clock size={16} />}
          isLoading={isLoading}
          accent={(stats?.pending ?? 0) > 0 ? "warning" : "success"}
        />
        <AdminStatCard
          label="Past Due"
          value={formatNumber(stats?.past_due ?? 0)}
          icon={<AlertTriangle size={16} />}
          isLoading={isLoading}
          // accent={(stats?.past_due ?? 0) > 0 ? "danger" : "success"}
        />
        <AdminStatCard
          label="Expired / Cancelled"
          value={formatNumber((stats?.expired ?? 0) + (stats?.cancelled ?? 0))}
          icon={<XCircle size={16} />}
          isLoading={isLoading}
          accent="primary"
          compact
        />
      </div>

      {/* Row 2 — revenue */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <AdminStatCard
          label="Total Revenue"
          value={formatCurrency(revenue?.total_revenue ?? 0)}
          icon={<CreditCard size={16} />}
          isLoading={revenueLoading}
          accent="primary"
          compact
        />
        <AdminStatCard
          label="Total Payments"
          value={formatNumber(revenue?.total_payments ?? 0)}
          icon={<CheckCircle size={16} />}
          isLoading={revenueLoading}
          accent="success"
          compact
        />
        <AdminStatCard
          label="Active Paying Vendors"
          value={formatNumber(revenue?.total_active_vendors ?? 0)}
          icon={<Users size={16} />}
          isLoading={revenueLoading}
          accent="info"
          compact
        />
      </div>
    </div>
  );
}
