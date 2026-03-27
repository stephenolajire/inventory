// src/pages/admin/notifications/components/NotificationsTable.tsx

import { Bell, ArrowUpRight } from "lucide-react";
import { formatDateTime, cn } from "../../../../lib/utils";
import { NotificationTypeBadge } from "./NotificationTypeBadge";
import type { NotificationListItem } from "../../../../types";

interface NotificationsTableProps {
  notifications: NotificationListItem[];
  loading: boolean;
  selectedId: string | null;
  activeFilters: number;
  onSelect: (id: string) => void;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-3 bg-bg-muted rounded-full animate-pulse"
            style={{ width: `${40 + ((i * 19) % 50)}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

export function NotificationsTable({
  notifications,
  loading,
  selectedId,
  activeFilters,
  onSelect,
}: NotificationsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-140">
        <thead>
          <tr className="border-b border-border bg-bg-subtle">
            {["", "Type", "Title", "Date", ""].map((h, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          ) : notifications.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-bg-subtle border border-border flex items-center justify-center">
                    <Bell size={22} className="text-text-muted opacity-40" />
                  </div>
                  <p className="text-sm font-semibold text-text-primary">
                    No notifications found
                  </p>
                  <p className="text-xs text-text-muted">
                    {activeFilters > 0
                      ? "Try adjusting your filters"
                      : "Notifications will appear here once sent"}
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            notifications.map((notif) => (
              <tr
                key={notif.id}
                onClick={() => onSelect(notif.id)}
                className={cn(
                  "border-b border-border transition-colors duration-100 cursor-pointer",
                  selectedId === notif.id
                    ? "bg-primary-subtle"
                    : "hover:bg-bg-subtle",
                )}
              >
                {/* Unread dot */}
                <td className="px-4 py-3 w-6">
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </td>

                <td className="px-4 py-3">
                  <NotificationTypeBadge type={notif.notification_type} />
                </td>

                <td className="px-4 py-3 max-w-60">
                  <p
                    className={cn(
                      "text-xs truncate",
                      notif.is_read
                        ? "text-text-muted"
                        : "font-semibold text-text-primary",
                    )}
                  >
                    {notif.title}
                  </p>
                  <p className="text-[10px] text-text-muted truncate mt-0.5">
                    {notif.message}
                  </p>
                </td>

                <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                  {formatDateTime(notif.created_at)}
                </td>

                <td className="px-4 py-3 text-text-muted">
                  <ArrowUpRight size={13} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
