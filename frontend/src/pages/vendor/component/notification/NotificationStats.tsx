// src/pages/vendor/notifications/components/NotificationsStats.tsx

import { Bell, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import type { NotificationPreferences } from "../../../../types";

interface NotificationsStatsProps {
  preferences: NotificationPreferences | undefined;
  isLoading: boolean;
}

export function NotificationsStats({
  preferences,
  isLoading,
}: NotificationsStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-bg-surface rounded-2xl border border-border p-4 animate-pulse"
          >
            <div className="h-3 w-16 bg-bg-muted rounded-full mb-2" />
            <div className="h-6 w-10 bg-bg-muted rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!preferences) return null;

  const stats = [
    {
      label: "Total",
      value: preferences.total_all,
      icon: <Bell size={14} />,
      color: "text-text-muted bg-bg-subtle border-border",
    },
    {
      label: "Unread",
      value: preferences.total_unread,
      icon: <Info size={14} />,
      color:
        preferences.total_unread > 0
          ? "text-primary bg-primary-subtle border-primary-muted"
          : "text-text-muted bg-bg-subtle border-border",
    },
    {
      label: "Low stock",
      value:
        preferences.by_type.find((t) => t.type === "low_stock")?.count ?? 0,
      icon: <AlertTriangle size={14} />,
      color: "text-warning bg-warning-subtle border-warning-muted",
    },
    {
      label: "Read",
      value: preferences.total_all - preferences.total_unread,
      icon: <CheckCircle2 size={14} />,
      color: "text-success bg-success-subtle border-success-muted",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-bg-surface rounded-2xl border border-border p-4"
        >
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-medium mb-2 px-2 py-1 rounded-lg border ${stat.color}`}
          >
            {stat.icon}
            {stat.label}
          </div>
          <div className="font-heading font-extrabold text-2xl text-text-primary">
            {stat.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
