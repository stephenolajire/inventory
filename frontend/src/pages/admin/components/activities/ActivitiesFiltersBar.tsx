// src/pages/admin/components/activities/ActivitiesFiltersBar.tsx

import { useState, useMemo } from "react";
import { Search, Filter, X } from "lucide-react";
import { useActivityActionTypes } from "../../../../hooks/admin";
import type { ActivityActionType } from "../../../../types";
import { cn } from "../../../../lib/utils";

export interface ActivitiesFiltersState {
  search: string;
  action_type: ActivityActionType | "";
}

interface ActivitiesFiltersBarProps {
  filters: ActivitiesFiltersState;
  onFilterChange: (patch: Partial<ActivitiesFiltersState>) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export function ActivitiesFiltersBar({
  filters,
  onFilterChange,
  onClear,
  isLoading,
}: ActivitiesFiltersBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const { data: actionTypes = [] } = useActivityActionTypes();

  const activeFilters = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.action_type) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-3">
      {/* ── Search + filters toggle ── */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search activities..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            disabled={isLoading}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-bg-surface text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
            showFilters
              ? "bg-primary text-white border-primary"
              : "bg-bg-surface text-text-primary border-border hover:bg-bg-subtle",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
          disabled={isLoading}
        >
          <Filter size={16} />
          <span className="text-sm font-medium">Filters</span>
          {activeFilters > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-info text-white text-xs font-semibold">
              {activeFilters}
            </span>
          )}
        </button>

        {activeFilters > 0 && (
          <button
            onClick={onClear}
            className="px-3 py-2 rounded-lg border border-border bg-bg-surface text-text-primary hover:bg-bg-subtle transition-all disabled:opacity-50"
            disabled={isLoading}
            title="Clear all filters"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Filters panel ── */}
      {showFilters && (
        <div className="p-4 rounded-lg border border-border bg-bg-subtle space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">
              Action Type
            </label>
            <select
              value={filters.action_type}
              onChange={(e) =>
                onFilterChange({
                  action_type: (e.target.value as ActivityActionType) || "",
                })
              }
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
            >
              <option value="">All Action Types</option>
              {actionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.display}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              onClick={() => setShowFilters(false)}
              className="px-3 py-2 text-sm font-medium text-text-primary hover:bg-bg-muted rounded-lg transition-all"
              disabled={isLoading}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
