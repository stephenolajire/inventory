// src/pages/vendor/notifications/NotificationsPage.tsx

import { useState, useMemo } from "react";
import {
  useNotificationList,
  useNotificationPreferences,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useClearAllNotifications,
} from "../../../hooks/vendor/useVendorNotification";
import { useNotificationStore } from "../../../store/notification.store";
import type { NotificationType } from "../../../types";

import { NotificationsHeader } from "../component/notification/NotificationHeader";
import { NotificationsFilter } from "../component/notification/NotificationFilter";
import { NotificationsStats } from "../component/notification/NotificationStats";
import { NotificationItem } from "../component/notification/NotificationItems";
import { NotificationsEmpty } from "../component/notification/NotificationEmpty";
import { NotificationsSkeleton } from "../component/notification/NotificationSkeleton";
import { NotificationsPagination } from "../component/notification/NotificationPagination";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const notifStore = useNotificationStore();

  // ── Filter state ──
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [isReadFilter, setIsReadFilter] = useState("");

  // ── Active filter count ──
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedType) count++;
    if (isReadFilter) count++;
    return count;
  }, [selectedType, isReadFilter]);

  // ── Build filters object ──
  const filters = useMemo(
    () => ({
      type: selectedType ? (selectedType as NotificationType) : undefined,
      is_read: isReadFilter ? isReadFilter === "true" : undefined,
      page,
    }),
    [selectedType, isReadFilter, page],
  );

  // ── Data hooks ──
  const list = useNotificationList(filters);
  const preferences = useNotificationPreferences();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteOne = useDeleteNotification();
  const clearAll = useClearAllNotifications();

  // ── Derived ──
  const notifications = list.data?.results ?? [];
  const totalCount = list.data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const unreadCount = notifStore.unreadCount;
  const hasFilters = activeFilterCount > 0;

  // ── Handlers ──

  function handleMarkRead(id: string) {
    markRead.mutate({ id });
  }

  function handleMarkAllRead() {
    markAllRead.mutate();
  }

  function handleDelete(id: string) {
    deleteOne.mutate({ id });
  }

  function handleClearAll() {
    clearAll.mutate();
  }

  function handleTypeChange(v: string) {
    setSelectedType(v);
    setPage(1);
  }

  function handleIsReadChange(v: string) {
    setIsReadFilter(v);
    setPage(1);
  }

  function handleReset() {
    setSelectedType("");
    setIsReadFilter("");
    setPage(1);
  }

  return (
    <div className="p-6 lg:p-8 max-w-8xl mx-auto">
      {/* Header */}
      <NotificationsHeader
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
        onClearAll={handleClearAll}
        onToggleFilter={() => setFilterOpen((v) => !v)}
        filterOpen={filterOpen}
        isMarkingAllRead={markAllRead.isPending}
        isClearing={clearAll.isPending}
      />

      {/* Stats */}
      <NotificationsStats
        preferences={preferences.data?.data}
        isLoading={preferences.isLoading}
      />

      {/* Filters */}
      <NotificationsFilter
        isOpen={filterOpen}
        selectedType={selectedType}
        isRead={isReadFilter}
        onType={handleTypeChange}
        onIsRead={handleIsReadChange}
        onReset={handleReset}
        activeCount={activeFilterCount}
      />

      {/* List */}
      {list.isLoading ? (
        <NotificationsSkeleton />
      ) : notifications.length === 0 ? (
        <NotificationsEmpty hasFilters={hasFilters} />
      ) : (
        <div className="bg-bg-surface rounded-2xl border border-border overflow-hidden">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
              isDeleting={deleteOne.isPending}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <NotificationsPagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPage={setPage}
        isLoading={list.isLoading}
      />
    </div>
  );
}
