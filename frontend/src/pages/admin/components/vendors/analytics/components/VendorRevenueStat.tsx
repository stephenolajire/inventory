// src/pages/admin/vendors/analytics/components/VendorRevenueStats.tsx

import {
  TrendingUp,
  ShoppingCart,
  Receipt,
  Percent,
  CalendarClock,
} from "lucide-react";
import { AdminStatCard } from "../../../analytics/AdminStatCard";
import {
  formatCurrency,
  formatNumber,
  formatDate,
} from "../../../../../../lib/utils";
import type { VendorAnalytics } from "../../../../../../types";

interface Props {
  revenue: VendorAnalytics["revenue"] | undefined;
  isLoading: boolean;
}

export function VendorRevenueStats({ revenue, isLoading }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <AdminStatCard
        label="Total Revenue"
        value={formatCurrency(revenue?.total_revenue ?? 0)}
        icon={<TrendingUp size={16} />}
        isLoading={isLoading}
        accent="primary"
      />
      <AdminStatCard
        label="Total Transactions"
        value={formatNumber(revenue?.total_transactions ?? 0)}
        icon={<ShoppingCart size={16} />}
        isLoading={isLoading}
        accent="success"
      />
      <AdminStatCard
        label="Avg. Order Value"
        value={formatCurrency(revenue?.avg_order_value ?? 0)}
        icon={<Receipt size={16} />}
        isLoading={isLoading}
        accent="info"
      />
      <AdminStatCard
        label="Tax Collected"
        value={formatCurrency(revenue?.total_tax_collected ?? 0)}
        icon={<Percent size={16} />}
        isLoading={isLoading}
        accent="warning"
      />

      {/* Second row — compact */}
      <AdminStatCard
        label="Items Sold"
        value={formatNumber(revenue?.total_items_sold ?? 0)}
        icon={<ShoppingCart size={16} />}
        isLoading={isLoading}
        accent="success"
        compact
      />
      <AdminStatCard
        label="First Sale"
        value={revenue?.first_sale_at ? formatDate(revenue.first_sale_at) : "—"}
        icon={<CalendarClock size={16} />}
        isLoading={isLoading}
        accent="info"
        compact
      />
      <AdminStatCard
        label="Last Sale"
        value={revenue?.last_sale_at ? formatDate(revenue.last_sale_at) : "—"}
        icon={<CalendarClock size={16} />}
        isLoading={isLoading}
        accent="info"
        compact
      />
      <AdminStatCard
        label="Avg. Items / Order"
        value={
          revenue?.total_transactions
            ? formatNumber(
                Math.round(
                  (revenue.total_items_sold ?? 0) / revenue.total_transactions,
                ),
              )
            : "—"
        }
        icon={<Receipt size={16} />}
        isLoading={isLoading}
        accent="primary"
        compact
      />
    </div>
  );
}
