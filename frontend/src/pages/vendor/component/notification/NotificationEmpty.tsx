// src/pages/vendor/notifications/components/NotificationsEmpty.tsx

import { Bell, CheckCircle2 } from "lucide-react";

interface NotificationsEmptyProps {
  hasFilters: boolean;
}

export function NotificationsEmpty({ hasFilters }: NotificationsEmptyProps) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-14 h-14 rounded-2xl bg-bg-subtle border border-border flex items-center justify-center">
          <Bell size={24} className="text-text-muted opacity-40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-text-primary">
            No notifications match your filters
          </p>
          <p className="text-xs text-text-muted mt-1">
            Try adjusting or resetting the filters above
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="relative w-16 h-16">
        <div className="w-16 h-16 rounded-2xl bg-success-subtle border border-success-muted flex items-center justify-center">
          <CheckCircle2 size={28} className="text-success" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-text-primary">
          All caught up!
        </p>
        <p className="text-xs text-text-muted mt-1">
          No notifications to show right now
        </p>
      </div>
    </div>
  );
}
