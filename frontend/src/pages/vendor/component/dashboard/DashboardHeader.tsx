// src/pages/vendor/dashboard/components/DashboardHeader.tsx

import { Link } from "react-router-dom";
import { Bell, ShoppingCart } from "lucide-react";
import { useAuthStore } from "../../../../store/auth.store";
import { useNotificationStore } from "../../../../store/notification.store";
import { ROUTES } from "../../../../constants/routes";
// import { cn } from "../../../../lib/utils";

interface DashboardHeaderProps {
  isLoading?: boolean;
}

export function DashboardHeader({ isLoading }: DashboardHeaderProps) {
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const firstName =
    (user as any)?.first_name || user?.email?.split("@")[0] || "Vendor";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Left — greeting */}
      <div>
        {isLoading ? (
          <div className="animate-pulse space-y-1.5">
            <div className="h-4 w-36 bg-bg-muted rounded-full" />
            <div className="h-6 w-48 bg-bg-muted rounded-full" />
          </div>
        ) : (
          <>
            <p className="text-sm text-text-muted">
              {greeting}, {firstName} 👋
            </p>
            <h1 className="font-heading font-extrabold text-xl text-text-primary mt-0.5">
              Here's what's happening today
            </h1>
          </>
        )}
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <Link
          to={ROUTES.NOTIFICATIONS}
          aria-label="Notifications"
          className="relative w-9 h-9 rounded-xl border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-all duration-150"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-error text-white text-[9px] font-bold flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        {/* Storekeeper shortcut */}
        <Link
          to={ROUTES.STOREKEEPER}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-md transition-all duration-150"
        >
          <ShoppingCart size={14} />
          Open counter
        </Link>
      </div>
    </div>
  );
}
