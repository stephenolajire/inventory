// src/pages/admin/components/activities/ActivitiesStatistics.tsx

import { Activity, TrendingUp, Zap } from "lucide-react";
import { ActivityStatsCard } from "./ActivityStatsCard";
import type { ActivityStatistics } from "../../../../types";

interface ActivitiesStatisticsProps {
  stats: ActivityStatistics | undefined;
  isLoading: boolean;
}

export function ActivitiesStatistics({
  stats,
  isLoading,
}: ActivitiesStatisticsProps) {
  const topActions = stats?.top_action_types.slice(0, 3) || [];
  const topUsers = stats?.top_users.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <ActivityStatsCard
          label="Total Activities"
          value={stats?.total_activities.toLocaleString() || "0"}
          icon={<Activity size={16} />}
          isLoading={isLoading}
          accent="primary"
        />
        <ActivityStatsCard
          label="Last 7 Days"
          value={stats?.activities_last_7_days.toLocaleString() || "0"}
          icon={<TrendingUp size={16} />}
          isLoading={isLoading}
          accent="success"
        />
        <ActivityStatsCard
          label="Daily Average"
          value={stats ? (stats.activities_last_7_days / 7).toFixed(0) : "0"}
          icon={<Zap size={16} />}
          isLoading={isLoading}
          accent="info"
        />
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Actions */}
        <div className="bg-bg-surface rounded-2xl border border-border p-5">
          <h3 className="font-heading font-bold text-base text-text-primary mb-4">
            Top Activities
          </h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-1">
                  <div className="h-3 w-24 bg-bg-muted rounded-full" />
                  <div className="h-4 w-full bg-bg-muted rounded-lg" />
                </div>
              ))}
            </div>
          ) : topActions.length > 0 ? (
            <div className="space-y-3">
              {topActions.map((action, idx) => {
                const maxCount = topActions[0].count || 1;
                const percentage = (action.count / maxCount) * 100;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-text-muted truncate capitalize">
                        {action.action_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-bold text-text-primary">
                        {action.count}
                      </span>
                    </div>
                    <div className="h-2 bg-bg-subtle rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-text-muted text-center py-4">
              No activity data yet
            </p>
          )}
        </div>

        {/* Top Users */}
        <div className="bg-bg-surface rounded-2xl border border-border p-5">
          <h3 className="font-heading font-bold text-base text-text-primary mb-4">
            Most Active Users
          </h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-1">
                  <div className="h-3 w-24 bg-bg-muted rounded-full" />
                  <div className="h-4 w-full bg-bg-muted rounded-lg" />
                </div>
              ))}
            </div>
          ) : topUsers.length > 0 ? (
            <div className="space-y-3">
              {topUsers.map((user, idx) => {
                const maxCount = topUsers[0].count || 1;
                const percentage = (user.count / maxCount) * 100;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-primary-subtle flex items-center justify-center text-primary text-xs font-bold shrink-0">
                          {user.user__email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-text-muted truncate">
                          {user.user__email}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-text-primary shrink-0">
                        {user.count}
                      </span>
                    </div>
                    <div className="h-2 bg-bg-subtle rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-text-muted text-center py-4">
              No user data yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
