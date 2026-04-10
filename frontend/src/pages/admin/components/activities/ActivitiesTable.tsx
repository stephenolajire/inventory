// src/pages/admin/components/activities/ActivitiesTable.tsx

import { Activity, ArrowUpRight } from "lucide-react";
import { formatDate, cn } from "../../../../lib/utils";
import { ActivityActionTypeBadge } from "./ActivityActionTypeBadge";
import type { ActivityListItem } from "../../../../types";

interface ActivitiesTableProps {
  activities: ActivityListItem[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-3 bg-bg-muted rounded-full animate-pulse"
            style={{ width: `${40 + ((i * 20) % 50)}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

const COLUMNS = [
  { label: "User", width: "30%" },
  { label: "Action", width: "15%" },
  { label: "Description", width: "35%" },
  { label: "Created", width: "16%" },
  { label: "", width: "4%" },
];

export function ActivitiesTable({
  activities,
  loading,
  selectedId,
  onSelect,
}: ActivitiesTableProps) {
  return (
    <div className="overflow-x-auto lg:overflow-x-visible">
      <table className="w-full" style={{ tableLayout: "fixed" }}>
        <thead>
          <tr className="border-b border-border bg-bg-subtle">
            {COLUMNS.map(({ label, width }) => (
              <th
                key={label}
                style={{ width }}
                className="px-4 py-3 text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
          ) : activities.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-bg-subtle border border-border flex items-center justify-center">
                    <Activity
                      size={22}
                      className="text-text-muted opacity-40"
                    />
                  </div>
                  <p className="text-sm font-semibold text-text-primary">
                    No activities found
                  </p>
                  <p className="text-xs text-text-muted">
                    Activities will appear here as users interact with the
                    system
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            activities.map((activity) => (
              <tr
                key={activity.id}
                onClick={() => onSelect(activity.id)}
                className={cn(
                  "border-b border-border transition-colors duration-100 cursor-pointer",
                  selectedId === activity.id
                    ? "bg-primary-subtle"
                    : "hover:bg-bg-subtle",
                )}
              >
                {/* User */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-primary-subtle flex items-center justify-center text-primary text-xs font-bold">
                      {activity.user_email.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs font-medium text-text-primary truncate">
                      {activity.user_email}
                    </p>
                  </div>
                </td>

                {/* Action Type */}
                <td className="px-4 py-3">
                  <ActivityActionTypeBadge
                    actionType={activity.action_type}
                    display={activity.action_display}
                    compact
                  />
                </td>

                {/* Description */}
                <td className="px-4 py-3">
                  <p className="text-xs text-text-muted truncate">
                    {activity.description || "—"}
                  </p>
                </td>

                {/* Created */}
                <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                  {formatDate(activity.created_at)}
                </td>

                {/* Arrow */}
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
