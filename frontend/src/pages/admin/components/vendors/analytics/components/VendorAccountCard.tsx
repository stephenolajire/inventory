// src/pages/admin/vendors/analytics/components/VendorAccountCard.tsx

import {
  Building2,
  Mail,
  MapPin,
  Phone,
  CalendarCheck,
  UserCheck,
} from "lucide-react";
import type { VendorAnalytics } from "../../../../../../types";
import { formatDate } from "../../../../../../lib/utils";

interface VendorAccountCardProps {
  account: VendorAnalytics["account"] | undefined;
  isLoading: boolean;
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-text-muted">{icon}</span>
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}

export function VendorAccountCard({
  account,
  isLoading,
}: VendorAccountCardProps) {
  if (isLoading) {
    return (
      <div className="bg-bg-surface rounded-2xl border border-border p-5 animate-pulse">
        <div className="h-4 w-32 bg-bg-muted rounded-full mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 bg-bg-muted rounded-full w-3/4" />
          ))}
        </div>
      </div>
    );
  }

  const location = [account?.lga, account?.state, account?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5">
      <h3 className="font-heading font-bold text-sm text-text-primary mb-4">
        Account Information
      </h3>

      <div className="space-y-3.5">
        <Row
          icon={<Building2 size={15} />}
          label="Business Name"
          value={account?.business_name}
        />
        <Row icon={<Mail size={15} />} label="Email" value={account?.email} />
        <Row icon={<Phone size={15} />} label="Phone" value={account?.phone} />
        <Row
          icon={<MapPin size={15} />}
          label="Location"
          value={location || null}
        />
        <Row
          icon={<CalendarCheck size={15} />}
          label="Joined"
          value={account?.joined_at ? formatDate(account.joined_at) : null}
        />
        <Row
          icon={<UserCheck size={15} />}
          label="Approved By"
          value={account?.approved_by ?? null}
        />
      </div>
    </div>
  );
}
