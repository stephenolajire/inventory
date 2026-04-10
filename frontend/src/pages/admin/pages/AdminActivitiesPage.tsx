// src/pages/admin/pages/AdminActivitiesPage.tsx

import { useState, useMemo } from "react";
import {
  useAdminActivities,
  useActivityStatistics,
} from "../../../hooks/admin";
import { formatNumber } from "../../../lib/utils";
import { RefreshCw } from "lucide-react";

import {
  ActivitiesFiltersBar,
  type ActivitiesFiltersState,
} from "../components/activities/ActivitiesFiltersBar";
import { ActivitiesTable } from "../components/activities/ActivitiesTable";
import { ActivityDetailPanel } from "../components/activities/ActivityDetailPanel";
import { ActivitiesStatistics } from "../components/activities/ActivitiesStatistics";
import type {
  ActivityListItem,
  ActivityDetail,
  ActivityActionType,
} from "../../../types";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const EMPTY_FILTERS: ActivitiesFiltersState = {
  search: "",
  action_type: "",
};

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function AdminActivitiesPage() {
  const [filters, setFilters] = useState<ActivitiesFiltersState>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(true);

  // ── Build query params ──
  const queryFilters = useMemo(
    () => ({
      ...(filters.search && { search: filters.search }),
      ...(filters.action_type && {
        action_type: filters.action_type as ActivityActionType,
      }),
      page,
    }),
    [filters, page],
  );

  // ── Queries ──
  const activitiesQuery = useAdminActivities(queryFilters);
  const statisticsQuery = useActivityStatistics();

  // ── Data ──
  const activities =
    activitiesQuery.data?.results ?? ([] as ActivityListItem[]);
  const total = activitiesQuery.data?.count ?? 0;
  const totalPages = Math.ceil(total / 20);
  const activeFilters = Object.values(filters).filter(Boolean).length;

  // Get selected activity details
  const selectedActivity = selectedId
    ? activities.find((a) => a.id === selectedId)
    : null;

  // ── Handlers ──
  const handleFilterChange = (patch: Partial<ActivitiesFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
    setSelectedId(null);
  };

  const handleClear = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
    setSelectedId(null);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedId(null);
  };

  const handleRefresh = () => {
    activitiesQuery.refetch();
    statisticsQuery.refetch();
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-8xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-xl text-text-primary">
            Activities
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            System activity audit log and user action tracking
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={activitiesQuery.isLoading}
          className="
            flex items-center gap-2 px-4 py-2.5 rounded-xl
            bg-primary text-white text-sm font-semibold shrink-0
            hover:bg-primary/90 shadow-sm
            transition-all duration-150 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <RefreshCw
            size={16}
            className={activitiesQuery.isLoading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* ── Statistics Toggle & Stats ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowStats(!showStats)}
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {showStats ? "Hide" : "Show"} Statistics
        </button>
      </div>

      {showStats && (
        <ActivitiesStatistics
          stats={statisticsQuery.data?.data}
          isLoading={statisticsQuery.isLoading}
        />
      )}

      {/* ── Filters + Info Bar ── */}
      <div className="space-y-3">
        <ActivitiesFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onClear={handleClear}
          isLoading={activitiesQuery.isLoading}
        />

        {/* Info line */}
        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-text-muted">
            Showing{" "}
            <span className="font-semibold text-text-primary">
              {activities.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-text-primary">
              {formatNumber(total)}
            </span>{" "}
            activities
            {activeFilters > 0 && (
              <span>
                {" "}
                ·{" "}
                <span className="text-primary font-semibold">
                  {activeFilters} filter{activeFilters !== 1 ? "s" : ""} active
                </span>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Activities Table ── */}
      <div className="rounded-2xl border border-border overflow-hidden bg-bg-surface">
        <ActivitiesTable
          activities={activities}
          loading={activitiesQuery.isLoading}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || activitiesQuery.isLoading}
            className="px-3 py-2 rounded-lg border border-border bg-bg-surface text-text-primary hover:bg-bg-subtle disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && page > 3) {
                pageNum = page - 2 + i;
              }
              if (pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  disabled={activitiesQuery.isLoading}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${
                      pageNum === page
                        ? "bg-primary text-white"
                        : "border border-border bg-bg-surface text-text-primary hover:bg-bg-subtle disabled:opacity-50"
                    }
                  `}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages || activitiesQuery.isLoading}
            className="px-3 py-2 rounded-lg border border-border bg-bg-surface text-text-primary hover:bg-bg-subtle disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            Next
          </button>
        </div>
      )}

      {/* ── Detail Panel ── */}
      {selectedId && (
        <ActivityDetailPanel
          activity={(selectedActivity as ActivityDetail) || null}
          loading={activitiesQuery.isLoading && !selectedActivity}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
