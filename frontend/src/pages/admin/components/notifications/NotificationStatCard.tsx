// src/pages/admin/notifications/components/NotificationStatCards.tsx

import { Bell, BellOff, Mail, Radio } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { NotificationStats } from "../../../../types";

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent,
  loading,
}: {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  accent: string;
  loading: boolean;
}) {
  return (
    <div className="bg-bg-surface border border-border rounded-2xl p-4 sm:p-5 flex items-start gap-3">
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
          accent,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-text-muted mb-1">{label}</p>
        {loading ? (
          <div className="h-5 w-12 bg-bg-muted rounded-full animate-pulse" />
        ) : (
          <p className="font-heading font-extrabold text-xl text-text-primary">
            {(value ?? 0).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Exported component
// ─────────────────────────────────────────────────────────────

const CHANNEL_LABEL: Record<string, string> = {
  in_app: "In-app",
  email: "Email",
  both: "Both",
};

interface NotificationStatCardsProps {
  stats: NotificationStats | undefined;
  loading: boolean;
}

export function NotificationStatCards({
  stats,
  loading,
}: NotificationStatCardsProps) {
  return (
    <div className="space-y-3">
      {/* ── Metric cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total"
          value={stats?.total}
          icon={<Bell size={16} className="text-primary" />}
          accent="bg-primary-subtle border border-primary-muted"
          loading={loading}
        />
        <StatCard
          label="Unread"
          value={stats?.total_unread}
          icon={<BellOff size={16} className="text-warning" />}
          accent="bg-warning-subtle border border-warning-muted"
          loading={loading}
        />
        <StatCard
          label="Emails sent"
          value={stats?.email_sent}
          icon={<Mail size={16} className="text-success" />}
          accent="bg-success-subtle border border-success-muted"
          loading={loading}
        />
        <StatCard
          label="Email pending"
          value={stats?.email_pending}
          icon={<Radio size={16} className="text-info" />}
          accent="bg-info-subtle border border-info-muted"
          loading={loading}
        />
      </div>

      {/* ── By channel breakdown ── */}
      {!loading && stats?.by_channel && stats.by_channel.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stats.by_channel.map((c) => (
            <div
              key={c.channel}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-bg-surface text-xs font-semibold text-text-muted"
            >
              {CHANNEL_LABEL[c.channel] ?? c.channel}
              <span className="font-bold text-text-primary">{c.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
