// src/pages/admin/scanners/components/ScannerPoolStats.tsx

import { ScanLine, CheckCircle, Users, XCircle, Archive } from "lucide-react";
import { AdminStatCard } from "../../components/analytics/AdminStatCard";
import { formatNumber } from "../../../../lib/utils";
import type { ScannerPoolStats } from "../../../../types";

interface Props {
  stats: ScannerPoolStats | undefined;
  isLoading: boolean;
}

export function ScannerPoolStatsRow({ stats, isLoading }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      <AdminStatCard
        label="Total Scanners"
        value={formatNumber(stats?.total ?? 0)}
        icon={<ScanLine size={16} />}
        isLoading={isLoading}
        accent="primary"
      />
      <AdminStatCard
        label="Available"
        value={formatNumber(stats?.available ?? 0)}
        icon={<CheckCircle size={16} />}
        isLoading={isLoading}
        accent="success"
      />
      <AdminStatCard
        label="Assigned"
        value={formatNumber(stats?.assigned ?? 0)}
        icon={<Users size={16} />}
        isLoading={isLoading}
        accent="info"
      />
      <AdminStatCard
        label="Revoked"
        value={formatNumber(stats?.revoked ?? 0)}
        icon={<XCircle size={16} />}
        isLoading={isLoading}
        accent={(stats?.revoked ?? 0) > 0 ? "warning" : "success"}
      />
      <AdminStatCard
        label="Retired"
        value={formatNumber(stats?.retired ?? 0)}
        icon={<Archive size={16} />}
        isLoading={isLoading}
        accent="primary"
        compact
      />
    </div>
  );
}
