// src/pages/admin/vendors/analytics/AdminVendorAnalyticsPage.tsx

import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAdminVendorAnalytics } from "../../../hooks/admin/useAdminVendors";

import { VendorAnalyticsHeader } from "../components/vendors/analytics/components/VendorAnalyticHeader";
import { VendorAccountCard } from "../components/vendors/analytics/components/VendorAccountCard";
import { VendorScannerSubscriptionCards } from "../components/vendors/analytics/components/VendorSubscriptionCard";
import { VendorRevenueStats } from "../components/vendors/analytics/components/VendorRevenueStat";
import { VendorMonthlyRevenueChart } from "../components/vendors/analytics/components/VendorMonthlyRevenueChart";
import { VendorPaymentBreakdown } from "../components/vendors/analytics/components/VendorPaymentBreakdown";
import { VendorProductStats } from "../components/vendors/analytics/components/VendorProductStat";
import {
  VendorTopProductsByUnits,
  VendorTopProductsByRevenue,
} from "../components/vendors/analytics/components/VendorTopProduct";
import { VendorCategoryBreakdown } from "../components/vendors/analytics/components/VendorCategoryBreakdown";

export default function AdminVendorAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useAdminVendorAnalytics(id ?? "");

  const analytics = data?.data;

  const monthlyData = useMemo(
    () => analytics?.monthly_breakdown ?? [],
    [analytics],
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-8xl mx-auto space-y-4 sm:space-y-6">
      {/* ── Header ── */}
      <VendorAnalyticsHeader
        businessName={analytics?.account.business_name}
        email={analytics?.account.email}
        status={analytics?.account.status}
        isLoading={isLoading}
      />

      {/* ── Revenue stat cards ── */}
      <VendorRevenueStats revenue={analytics?.revenue} isLoading={isLoading} />

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Monthly revenue — 2/3 */}
        <div className="lg:col-span-2">
          <VendorMonthlyRevenueChart data={monthlyData} isLoading={isLoading} />
        </div>

        {/* Payment breakdown — 1/3 */}
        <div>
          <VendorPaymentBreakdown
            data={analytics?.revenue.by_payment_method}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* ── Product stats ── */}
      <div>
        <h2 className="font-heading font-bold text-base text-text-primary mb-3">
          Products
        </h2>
        <VendorProductStats
          products={analytics?.products}
          isLoading={isLoading}
        />
      </div>

      {/* ── Top products + category breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <VendorTopProductsByUnits
          data={analytics?.products.top_by_units}
          isLoading={isLoading}
        />
        <VendorTopProductsByRevenue
          data={analytics?.revenue.top_by_revenue}
          isLoading={isLoading}
        />
        <VendorCategoryBreakdown
          data={analytics?.products.by_category}
          isLoading={isLoading}
        />
      </div>

      {/* ── Account + Scanner + Subscription ── */}
      <div>
        <h2 className="font-heading font-bold text-base text-text-primary mb-3">
          Account Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <VendorAccountCard
            account={analytics?.account}
            isLoading={isLoading}
          />
          <VendorScannerSubscriptionCards
            scanner={analytics?.scanner}
            subscription={analytics?.subscription}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
