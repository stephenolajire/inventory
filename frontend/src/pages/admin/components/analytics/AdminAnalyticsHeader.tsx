// src/pages/admin/analytics/components/AdminAnalyticsHeader.tsx

import { BarChart2 } from "lucide-react";
import { useAuthStore } from "../../../../store/auth.store";

interface AdminAnalyticsHeaderProps {
  isLoading?: boolean;
}

export function AdminAnalyticsHeader({ isLoading }: AdminAnalyticsHeaderProps) {
  const user = useAuthStore((s) => s.user);

  const firstName =
    (user as any)?.first_name || user?.email?.split("@")[0] || "Admin";

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
            <div className="h-6 w-52 bg-bg-muted rounded-full" />
          </div>
        ) : (
          <>
            <p className="text-sm text-text-muted">
              {greeting}, {firstName} 👋
            </p>
            <h1 className="font-heading font-extrabold text-xl text-text-primary mt-0.5">
              Platform Overview
            </h1>
          </>
        )}
      </div>

      {/* Right — badge */}
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-subtle border border-border text-xs font-semibold text-text-muted">
        <BarChart2 size={14} className="text-primary" />
        Admin Analytics
      </div>
    </div>
  );
}
