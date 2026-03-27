import { useMemo } from "react";
import {
  useVendorSalesSummary,
  useVendorSalesByProduct,
  useVendorSalesByPaymentMethod,
  useVendorSalesList,
} from "../../../hooks/vendor/useVendorSales";
import { useMonthlyRevenue } from "../../../hooks/vendor/useVendorAnalytics";
import { useProducts } from "../../../hooks/vendor/useVendorProduct";
import { useUnreadCount } from "../../../hooks/vendor/useVendorNotification";
import { formatCurrency, formatNumber } from "../../../lib/utils";
import { TrendingUp, ShoppingCart, Package, CreditCard } from "lucide-react";

import { DashboardHeader } from "../component/dashboard/DashboardHeader";
import { DashboardStatCard } from "../component/dashboard/DashboardStatCard";
import { DashboardRevenueChart } from "../component/dashboard/DashboardRevenueChart";
import { DashboardTopProducts } from "../component/dashboard/DashboardTopProducts";
import { DashboardLowStock } from "../component/dashboard/DashboardLowStock";
import { DashboardRecentSales } from "../component/dashboard/DashboardRecentSales";
import { DashboardPaymentBreakdown } from "../component/dashboard/DashboardPaymentBreakdown";
import { DashboardQuickActions } from "../component/dashboard/DashboardQuickAction";

// const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const RECENT_SALES_OPTIONS = { page: 1 };
const LOW_STOCK_OPTIONS = { low_stock: true };
const MONTHLY_OPTIONS = { months: 6 };
const TOP_PRODUCTS_OPTIONS = { limit: 5 };

export default function DashboardPage() {
  const summary = useVendorSalesSummary();
  const monthly = useMonthlyRevenue(MONTHLY_OPTIONS);
  const byProduct = useVendorSalesByProduct(TOP_PRODUCTS_OPTIONS);
  const byMethod = useVendorSalesByPaymentMethod();
  const recentSales = useVendorSalesList(RECENT_SALES_OPTIONS);
  const lowStock = useProducts(LOW_STOCK_OPTIONS);

  useUnreadCount();

  const stats = summary.data?.data;
  const monthlyData = useMemo(() => monthly.data?.data ?? [], [monthly.data]);
  const topProducts = useMemo(
    () => byProduct.data?.data ?? [],
    [byProduct.data],
  );
  const paymentData = useMemo(() => byMethod.data?.data ?? [], [byMethod.data]);
  const recentData = useMemo(
    () => recentSales.data?.results ?? [],
    [recentSales.data],
  );
  const lowStockData = useMemo(
    () => lowStock.data?.results ?? [],
    [lowStock.data],
  );

  const isStatsLoading = summary.isLoading;
  const isChartsLoading =
    monthly.isLoading || byProduct.isLoading || byMethod.isLoading;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-8xl mx-auto">
      <DashboardHeader isLoading={isStatsLoading} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <DashboardStatCard
          label="Today's Revenue"
          value={formatCurrency(stats?.today.revenue ?? 0)}
          icon={<TrendingUp size={16} />}
          trend={stats?.month_vs_last_pct}
          subLabel="vs last month"
          isLoading={isStatsLoading}
          accent="primary"
        />
        <DashboardStatCard
          label="Today's Orders"
          value={formatNumber(stats?.today.orders ?? 0)}
          icon={<ShoppingCart size={16} />}
          isLoading={isStatsLoading}
          accent="success"
        />
        <DashboardStatCard
          label="This Month"
          value={formatCurrency(stats?.this_month.revenue ?? 0)}
          icon={<CreditCard size={16} />}
          isLoading={isStatsLoading}
          accent="info"
        />
        <DashboardStatCard
          label="Low Stock Items"
          value={formatNumber(lowStockData.length)}
          icon={<Package size={16} />}
          isLoading={lowStock.isLoading}
          accent={lowStockData.length > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2">
          <DashboardRevenueChart
            data={monthlyData}
            isLoading={isChartsLoading}
          />
        </div>
        <div>
          <DashboardQuickActions />
        </div>

        <div className="lg:col-span-2">
          <DashboardTopProducts
            data={topProducts}
            isLoading={byProduct.isLoading}
          />
        </div>
        <div>
          <DashboardPaymentBreakdown
            data={paymentData}
            isLoading={byMethod.isLoading}
          />
        </div>

        <div className="lg:col-span-2">
          <DashboardRecentSales
            data={recentData}
            isLoading={recentSales.isLoading}
          />
        </div>
        <div>
          <DashboardLowStock
            data={lowStockData}
            isLoading={lowStock.isLoading}
          />
        </div>
      </div>
    </div>
  );
}
