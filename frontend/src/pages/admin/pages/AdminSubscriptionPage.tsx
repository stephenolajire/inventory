// src/pages/admin/subscriptions/AdminSubscriptionsPage.tsx

import { useState, useMemo } from "react";
import { useAdminSubscriptionsDashboard } from "../../../hooks/admin/useAdminSubscriptions";
import type {
  AdminSubscriptionListItem,
  SubscriptionStatus,
  PlanName,
  BillingCycle,
} from "../../../types";

import { SubscriptionsHeader } from "../components/subscriptions/SubscriptionsHeader";
import { SubscriptionStatsRow } from "../components/subscriptions/SubscriptionStatsRow";
import {
  PlanDistributionChart,
  RevenueByPlanChart,
} from "../components/subscriptions/SubscriptionPlanCharts";
import { SubscriptionsTable } from "../components/subscriptions/SubscriptionsTable";
import { PaymentLogTable } from "../components/subscriptions/PaymentLogTable";
import {
  OverridePlanModal,
  ExpireSubscriptionModal,
} from "../components/subscriptions/SubscriptionActionModals";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ActionMode = "override" | "expire";

interface ActionModalState {
  open: boolean;
  mode: ActionMode | null;
  subscription: AdminSubscriptionListItem | null;
}

interface SubFilters {
  search?: string;
  status?: SubscriptionStatus;
  plan?: PlanName;
  billing_cycle?: BillingCycle;
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function AdminSubscriptionsPage() {
  const [subFilters, setSubFilters] = useState<SubFilters>({});
  const [subPage, setSubPage] = useState(1);
  const [payPage, setPayPage] = useState(1);

  const [actionModal, setActionModal] = useState<ActionModalState>({
    open: false,
    mode: null,
    subscription: null,
  });

  // ── Merge page into filters for the hook ──
  const subFiltersWithPage = useMemo(
    () => ({ ...subFilters, page: subPage }),
    [subFilters, subPage],
  );

  const payFiltersWithPage = useMemo(() => ({ page: payPage }), [payPage]);

  const { subscriptions, stats, revenue, payments, override, expire } =
    useAdminSubscriptionsDashboard(
      subFiltersWithPage,
      undefined,
      payFiltersWithPage,
    );

  const subList = subscriptions.data?.results ?? [];
  const hasNext = !!subscriptions.data?.next;
  const hasPrev = !!subscriptions.data?.previous;
  const payList = payments.data?.results ?? [];
  const payNext = !!payments.data?.next;
  const payPrev = !!payments.data?.previous;

  // ── Filter change resets page ──
  function handleSubFilterChange(next: SubFilters) {
    setSubFilters(next);
    setSubPage(1);
  }

  // ── Modal helpers ──
  function openAction(mode: ActionMode, sub: AdminSubscriptionListItem) {
    setActionModal({ open: true, mode, subscription: sub });
  }
  function closeAction() {
    setActionModal({ open: false, mode: null, subscription: null });
  }

  // ── Mutation handlers ──
  function handleOverride(
    planName: PlanName,
    billingCycle: BillingCycle,
    reason: string,
  ) {
    if (!actionModal.subscription) return;
    override.mutate(
      {
        subscription_id: actionModal.subscription.id,
        plan_name: planName,
        billing_cycle: billingCycle,
        reason,
      },
      { onSuccess: closeAction },
    );
  }

  function handleExpire(reason: string) {
    if (!actionModal.subscription) return;
    expire.mutate(
      { subscription_id: actionModal.subscription.id, reason },
      { onSuccess: closeAction },
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-8xl mx-auto space-y-4 sm:space-y-6">
      {/* ── Header ── */}
      <SubscriptionsHeader isLoading={stats.isLoading} />

      {/* ── Stat cards ── */}
      <SubscriptionStatsRow
        stats={stats.data?.data}
        revenue={revenue.data?.data}
        isLoading={stats.isLoading}
        revenueLoading={revenue.isLoading}
      />

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Revenue by plan — 2/3 */}
        <div className="lg:col-span-2">
          <RevenueByPlanChart
            revenue={revenue.data?.data}
            isLoading={revenue.isLoading}
          />
        </div>

        {/* Plan distribution donut — 1/3 */}
        <div>
          <PlanDistributionChart
            stats={stats.data?.data}
            isLoading={stats.isLoading}
          />
        </div>
      </div>

      {/* ── Subscriptions table ── */}
      <SubscriptionsTable
        subscriptions={subList}
        isLoading={subscriptions.isLoading}
        filters={subFilters}
        page={subPage}
        hasNext={hasNext}
        hasPrev={hasPrev}
        onFilterChange={handleSubFilterChange}
        onPageNext={() => setSubPage((p) => p + 1)}
        onPagePrev={() => setSubPage((p) => p - 1)}
        onAction={openAction}
      />

      {/* ── Payment log ── */}
      <PaymentLogTable
        payments={payList}
        isLoading={payments.isLoading}
        page={payPage}
        hasNext={payNext}
        hasPrev={payPrev}
        onPageNext={() => setPayPage((p) => p + 1)}
        onPagePrev={() => setPayPage((p) => p - 1)}
      />

      {/* ── Override Plan modal ── */}
      <OverridePlanModal
        open={actionModal.open && actionModal.mode === "override"}
        subscription={actionModal.subscription}
        isLoading={override.isPending}
        onConfirm={handleOverride}
        onClose={closeAction}
      />

      {/* ── Force Expire modal ── */}
      <ExpireSubscriptionModal
        open={actionModal.open && actionModal.mode === "expire"}
        subscription={actionModal.subscription}
        isLoading={expire.isPending}
        onConfirm={handleExpire}
        onClose={closeAction}
      />
    </div>
  );
}
