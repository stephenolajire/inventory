// src/pages/admin/notifications/AdminNotificationsPage.tsx

import { useState, useCallback } from "react";
import {
  useAdminNotifications,
  useAdminNotificationStats,
} from "../../../hooks/admin/useAdminNotification";
import { NotificationStatCards } from "../components/notifications/NotificationStatCard";
import {
  NotificationsFiltersBar,
  type NotifFiltersState,
} from "../components/notifications/NotificationFilterBar";
import { NotificationsTable } from "../components/notifications/NotificationTable";
import { NotificationsPagination } from "../components/notifications/NotificationPagination";
import { BroadcastForm } from "../components/notifications/BroadcastForm";
import { NotificationDetailPanel } from "../components/notifications/NotificationDetailPanel";
import type { NotificationListItem } from "../../../types";

// ─────────────────────────────────────────────────────────────

const EMPTY_FILTERS: NotifFiltersState = {
  type: "",
  is_read: "",
};

export default function AdminNotificationsPage() {
  const [filters, setFilters] = useState<NotifFiltersState>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Build query params ──
  const queryFilters = {
    ...(filters.type && { type: filters.type }),
    ...(filters.is_read && { is_read: filters.is_read === "true" }),
    page,
  };

  // ── Queries ──
  const notifsQuery = useAdminNotifications(queryFilters);
  const statsQuery = useAdminNotificationStats();

  const notifications =
    notifsQuery.data?.results ?? ([] as NotificationListItem[]);
  const total = notifsQuery.data?.count ?? 0;
  const totalPages = Math.ceil(total / 20);
  const activeFilters = Object.values(filters).filter(Boolean).length;

  // ── Handlers ──
  const handleFilterChange = useCallback(
    (patch: Partial<NotifFiltersState>) => {
      setFilters((prev) => ({ ...prev, ...patch }));
      setPage(1);
    },
    [],
  );

  function handleClear() {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  // ─────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-8xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="font-heading font-extrabold text-xl text-text-primary">
          Notifications
        </h1>
        <p className="text-xs text-text-muted mt-0.5">
          Broadcast messages and view notification history
        </p>
      </div>

      {/* ── Stat cards ── */}
      <NotificationStatCards
        stats={statsQuery.data?.data}
        loading={statsQuery.isLoading}
      />

      {/* ── Two-column layout on lg+ ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Left: table ── */}
        <div className="flex-1 min-w-0">
          <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden">
            <NotificationsFiltersBar
              filters={filters}
              onChange={handleFilterChange}
              onClear={handleClear}
              showFilters={showFilters}
              onToggle={() => setShowFilters((v) => !v)}
            />

            <NotificationsTable
              notifications={notifications}
              loading={notifsQuery.isLoading}
              selectedId={selectedId}
              activeFilters={activeFilters}
              onSelect={setSelectedId}
            />

            <NotificationsPagination
              page={page}
              totalPages={totalPages}
              total={total}
              hasNext={!!notifsQuery.data?.next}
              hasPrev={!!notifsQuery.data?.previous}
              isFetching={notifsQuery.isFetching}
              onNext={() => setPage((p) => p + 1)}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
            />
          </div>
        </div>

        {/* ── Right: broadcast form (sticky on desktop) ── */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-8">
          <BroadcastForm />
        </div>
      </div>

      {/* ── Detail panel ── */}
      {selectedId && (
        <NotificationDetailPanel
          notificationId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
