// src/pages/admin/analytics/AdminAnalyticsPage.tsx

import { useMemo } from "react";
import { useAdminAnalyticsDashboard } from "../../../hooks/admin/useAdminAnalytics";
import { formatCurrency, formatNumber } from "../../../lib/utils";
import { TrendingUp, Users, ShoppingCart, Clock, Store } from "lucide-react";

import { AdminAnalyticsHeader } from "../components/analytics/AdminAnalyticsHeader";
import { AdminStatCard } from "../components/analytics/AdminStatCard";
import { AdminRevenueChart } from "../components/analytics/AdminRevenueChart";
import { AdminTopVendors } from "../components/analytics/AdminTopVendors";
import { AdminSubscriptionDistribution } from "../components/analytics/AdminSubscriptionDistribution";
import { AdminRegistrationTrend } from "../components/analytics/AdminRegistrationTrend";
import { AdminPendingVendors } from "../components/analytics/AdminPendingVendors";

const DASHBOARD_PARAMS = { months: 6, vendorLimit: 8 };

export default function AdminAnalyticsPage() {
  const { summary, monthly, topVendors, subscriptions, registrations } =
    useAdminAnalyticsDashboard(DASHBOARD_PARAMS);

  const stats = summary.data?.data;
  const monthlyData = useMemo(() => monthly.data?.data ?? [], [monthly.data]);
  const topVendorsData = useMemo(
    () => topVendors.data?.data ?? [],
    [topVendors.data],
  );
  const subsData = useMemo(
    () => subscriptions.data?.data ?? [],
    [subscriptions.data],
  );
  const regData = useMemo(
    () => registrations.data?.data ?? [],
    [registrations.data],
  );

  const isStatsLoading = summary.isLoading;
//   const isChartsLoading = monthly.isLoading || topVendors.isLoading;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-8xl mx-auto">
      <AdminAnalyticsHeader isLoading={isStatsLoading} />

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <AdminStatCard
          label="Today's Revenue"
          value={formatCurrency(stats?.today.revenue ?? 0)}
          icon={<TrendingUp size={16} />}
          isLoading={isStatsLoading}
          accent="primary"
        />
        <AdminStatCard
          label="Today's Orders"
          value={formatNumber(stats?.today.orders ?? 0)}
          icon={<ShoppingCart size={16} />}
          isLoading={isStatsLoading}
          accent="success"
        />
        <AdminStatCard
          label="Active Vendors"
          value={formatNumber(stats?.total_vendors ?? 0)}
          icon={<Store size={16} />}
          isLoading={isStatsLoading}
          accent="info"
        />
        <AdminStatCard
          label="Pending Approval"
          value={formatNumber(stats?.pending_vendors ?? 0)}
          icon={<Clock size={16} />}
          isLoading={isStatsLoading}
          accent={(stats?.pending_vendors ?? 0) > 0 ? "warning" : "success"}
        />
      </div>

      {/* ── All-time + this month strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <AdminStatCard
          label="All-Time Revenue"
          value={formatCurrency(stats?.all_time.revenue ?? 0)}
          icon={<TrendingUp size={16} />}
          isLoading={isStatsLoading}
          accent="primary"
          compact
        />
        <AdminStatCard
          label="All-Time Orders"
          value={formatNumber(stats?.all_time.orders ?? 0)}
          icon={<ShoppingCart size={16} />}
          isLoading={isStatsLoading}
          accent="success"
          compact
        />
        <AdminStatCard
          label="This Month's Revenue"
          value={formatCurrency(stats?.this_month.revenue ?? 0)}
          icon={<Users size={16} />}
          isLoading={isStatsLoading}
          accent="info"
          compact
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Revenue chart — 2/3 */}
        <div className="lg:col-span-2">
          <AdminRevenueChart data={monthlyData} isLoading={monthly.isLoading} />
        </div>

        {/* Subscription distribution — 1/3 */}
        <div>
          <AdminSubscriptionDistribution
            data={subsData}
            isLoading={subscriptions.isLoading}
          />
        </div>

        {/* Top vendors — 2/3 */}
        <div className="lg:col-span-2">
          <AdminTopVendors
            data={topVendorsData}
            isLoading={topVendors.isLoading}
          />
        </div>

        {/* Pending vendors quick action — 1/3 */}
        <div>
          <AdminPendingVendors
            count={stats?.pending_vendors ?? 0}
            isLoading={isStatsLoading}
          />
        </div>

        {/* Registration trend — full width */}
        <div className="lg:col-span-3">
          <AdminRegistrationTrend
            data={regData}
            isLoading={registrations.isLoading}
          />
        </div>
      </div>
    </div>
  );
}
