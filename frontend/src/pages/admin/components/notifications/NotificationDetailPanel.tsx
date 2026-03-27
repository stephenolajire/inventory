// src/pages/admin/notifications/components/NotificationDetailPanel.tsx

import { X, Bell } from "lucide-react";
import { useAdminNotificationDetail } from "../../../../hooks/admin/useAdminNotification";
import { formatDateTime, cn } from "../../../../lib/utils";
import { NotificationTypeBadge } from "./NotificationTypeBadge";

interface NotificationDetailPanelProps {
  notificationId: string;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const CHANNEL_LABEL: Record<string, string> = {
  in_app: "In-app",
  email: "Email",
  both: "In-app + Email",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
        {title}
      </p>
      <div className="bg-bg-subtle rounded-xl border border-border divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <span className="text-xs text-text-muted shrink-0 mt-0.5">{label}</span>
      <div className="text-xs font-medium text-text-primary text-right">
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function NotificationDetailPanel({
  notificationId,
  onClose,
}: NotificationDetailPanelProps) {
  const { data, isLoading } = useAdminNotificationDetail(notificationId);
  const notif = data?.data;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="
        fixed right-0 top-0 bottom-0 z-50
        w-full sm:w-100
        bg-bg-surface border-l border-border
        flex flex-col shadow-2xl
        animate-in slide-in-from-right duration-200
      "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <Bell size={15} className="text-primary" />
            <span className="font-heading font-bold text-sm text-text-primary">
              Notification detail
            </span>
          </div>
          <button
            onClick={onClose}
            className="
              w-7 h-7 rounded-lg border border-border
              flex items-center justify-center
              text-text-muted hover:text-text-primary hover:bg-bg-subtle
              transition-all duration-150
            "
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-bg-muted rounded-xl" />
              ))}
            </div>
          ) : !notif ? (
            <p className="text-sm text-text-muted text-center py-10">
              Notification not found
            </p>
          ) : (
            <div className="space-y-5">
              {/* ── Status strip ── */}
              <div
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold",
                  notif.is_read
                    ? "bg-bg-subtle border-border text-text-muted"
                    : "bg-primary-subtle border-primary-muted text-primary",
                )}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    notif.is_read ? "bg-text-muted" : "bg-primary",
                  )}
                />
                {notif.is_read ? "Read" : "Unread"}
              </div>

              {/* ── Overview ── */}
              <Section title="Overview">
                <DetailRow label="Type">
                  <NotificationTypeBadge type={notif.notification_type} />
                </DetailRow>
                <DetailRow label="Channel">
                  {CHANNEL_LABEL[notif.channel] ?? notif.channel}
                </DetailRow>
                <DetailRow label="Sent at">
                  {formatDateTime(notif.created_at)}
                </DetailRow>
                {notif.read_at && (
                  <DetailRow label="Read at">
                    {formatDateTime(notif.read_at)}
                  </DetailRow>
                )}
              </Section>

              {/* ── Content ── */}
              <Section title="Content">
                <div className="px-4 py-3">
                  <p className="text-xs font-semibold text-text-primary mb-1">
                    {notif.title}
                  </p>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              </Section>

              {/* ── Action URL ── */}
              {notif.action_url && (
                <Section title="Action">
                  <DetailRow label="URL">
                    <a
                      href={notif.action_url}
                      className="text-primary hover:underline break-all text-right"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {notif.action_url}
                    </a>
                  </DetailRow>
                </Section>
              )}

              {/* ── Related object ── */}
              {(notif.related_object_type || notif.related_object_id) && (
                <Section title="Related object">
                  {notif.related_object_type && (
                    <DetailRow label="Type">
                      {notif.related_object_type}
                    </DetailRow>
                  )}
                  {notif.related_object_id && (
                    <DetailRow label="ID">
                      <span className="font-mono text-[10px]">
                        {notif.related_object_id}
                      </span>
                    </DetailRow>
                  )}
                </Section>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
