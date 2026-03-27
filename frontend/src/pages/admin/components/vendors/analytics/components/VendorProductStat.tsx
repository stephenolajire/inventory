// src/pages/admin/vendors/analytics/components/VendorProductStats.tsx

import { Package, AlertTriangle, XCircle, Tag } from "lucide-react";
import { AdminStatCard } from "../../../analytics/AdminStatCard";
import { formatCurrency, formatNumber } from "../../../../../../lib/utils";
import type { VendorAnalytics } from "../../../../../../types";

interface Props {
  products: VendorAnalytics["products"] | undefined;
  isLoading: boolean;
}

export function VendorProductStats({ products, isLoading }: Props) {
  return (
    <div className="space-y-4">
      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AdminStatCard
          label="Total Products"
          value={formatNumber(products?.total_products ?? 0)}
          icon={<Package size={16} />}
          isLoading={isLoading}
          accent="primary"
          compact
        />
        <AdminStatCard
          label="Active Products"
          value={formatNumber(products?.active_products ?? 0)}
          icon={<Package size={16} />}
          isLoading={isLoading}
          accent="success"
          compact
        />
        <AdminStatCard
          label="Low Stock"
          value={formatNumber(products?.low_stock_count ?? 0)}
          icon={<AlertTriangle size={16} />}
          isLoading={isLoading}
          accent={(products?.low_stock_count ?? 0) > 0 ? "warning" : "success"}
          compact
        />
        <AdminStatCard
          label="Out of Stock"
          value={formatNumber(products?.out_of_stock_count ?? 0)}
          icon={<XCircle size={16} />}
          isLoading={isLoading}
        //   accent={
        //     (products?.out_of_stock_count ?? 0) > 0 ? "danger" : "success"
        //   }
          compact
        />
        <AdminStatCard
          label="Stock Value"
          value={formatCurrency(products?.total_stock_value ?? 0)}
          icon={<Tag size={16} />}
          isLoading={isLoading}
          accent="info"
          compact
        />
        <AdminStatCard
          label="Avg. Price"
          value={formatCurrency(products?.avg_selling_price ?? 0)}
          icon={<Tag size={16} />}
          isLoading={isLoading}
          accent="primary"
          compact
        />
        <AdminStatCard
          label="Units Sold (Total)"
          value={formatNumber(products?.total_units_sold ?? 0)}
          icon={<Package size={16} />}
          isLoading={isLoading}
          accent="success"
          compact
        />
        <AdminStatCard
          label="On Discount"
          value={formatNumber(products?.discounted_products ?? 0)}
          icon={<Tag size={16} />}
          isLoading={isLoading}
          accent="warning"
          compact
        />
      </div>
    </div>
  );
}
