// src/pages/admin/scanners/AdminScannersPage.tsx

import { useState } from "react";
import { useAdminScannersDashboard } from "../../../hooks/admin/useAdminScanners";
import type {
  ScannerListItem,
  ScannerFilters,
  RegisterScannerRequest,
} from "../../../types";

import { ScannersHeader } from "../components/scanners/ScannerHeader";
import { ScannerPoolStatsRow } from "../components/scanners/ScannerPoolStat";
import { ScannerTable } from "../components/scanners/Scannertable";
import { RegisterScannerModal } from "../components/scanners/RegisterScannerModal";
import {
  RevokeScannerModal,
  RetireScannerModal,
  ReassignScannerModal,
} from "../components/scanners/ScannerActionModal";
import { ScannerDetailModal } from "../components/scanners/ScannerDetailModal";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ActionMode = "revoke" | "retire" | "reassign";

interface ActionModalState {
  open: boolean;
  mode: ActionMode | null;
  scanner: ScannerListItem | null;
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function AdminScannersPage() {
  const [filters, setFilters] = useState<ScannerFilters>({});
  const [page, setPage] = useState(1);
  const [showRegister, setShowRegister] = useState(false);
  const [viewScannerId, setViewScannerId] = useState<string | null>(null);

  const [actionModal, setActionModal] = useState<ActionModalState>({
    open: false,
    mode: null,
    scanner: null,
  });

  const { scanners, stats, register, revoke, reassign, retire } =
    useAdminScannersDashboard(filters);

  const scannerList = scanners.data?.results ?? [];
  const hasNext = !!scanners.data?.next;
  const hasPrev = !!scanners.data?.previous;
  const poolStats = stats.data?.data;

  // ── Filter change resets page ──
  function handleFilterChange(next: ScannerFilters) {
    setFilters(next);
    setPage(1);
  }

  // ── Action modal helpers ──
  function openAction(mode: ActionMode, scanner: ScannerListItem) {
    setActionModal({ open: true, mode, scanner });
  }
  function closeAction() {
    setActionModal({ open: false, mode: null, scanner: null });
  }

  // ── Mutation handlers ──
  function handleRegister(data: RegisterScannerRequest) {
    register.mutate(data, { onSuccess: () => setShowRegister(false) });
  }

  function handleRevoke(reason: string) {
    if (!actionModal.scanner) return;
    revoke.mutate(
      { scanner_id: actionModal.scanner.id, revoke_reason: reason },
      { onSuccess: closeAction },
    );
  }

  function handleReassign(vendorId: string) {
    if (!actionModal.scanner) return;
    reassign.mutate(
      { scanner_id: actionModal.scanner.id, vendor_id: vendorId },
      { onSuccess: closeAction },
    );
  }

  function handleRetire() {
    if (!actionModal.scanner) return;
    retire.mutate(
      { scanner_id: actionModal.scanner.id },
      { onSuccess: closeAction },
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-8xl mx-auto space-y-4 sm:space-y-6">
      {/* ── Header ── */}
      <ScannersHeader isLoading={stats.isLoading} />

      {/* ── Pool stat cards ── */}
      <ScannerPoolStatsRow stats={poolStats} isLoading={stats.isLoading} />

      {/* ── Scanner table ── */}
      <ScannerTable
        scanners={scannerList}
        isLoading={scanners.isLoading}
        filters={filters}
        page={page}
        hasNext={hasNext}
        hasPrev={hasPrev}
        onFilterChange={handleFilterChange}
        onPageNext={() => setPage((p) => p + 1)}
        onPagePrev={() => setPage((p) => p - 1)}
        onAction={openAction}
        onView={(id) => setViewScannerId(id)}
        onRegister={() => setShowRegister(true)}
      />

      {/* ── Register modal ── */}
      <RegisterScannerModal
        open={showRegister}
        isLoading={register.isPending}
        onConfirm={handleRegister}
        onClose={() => setShowRegister(false)}
      />

      {/* ── Revoke modal ── */}
      <RevokeScannerModal
        open={actionModal.open && actionModal.mode === "revoke"}
        scanner={actionModal.scanner}
        isLoading={revoke.isPending}
        onConfirm={handleRevoke}
        onClose={closeAction}
      />

      {/* ── Retire modal ── */}
      <RetireScannerModal
        open={actionModal.open && actionModal.mode === "retire"}
        scanner={actionModal.scanner}
        isLoading={retire.isPending}
        onConfirm={handleRetire}
        onClose={closeAction}
      />

      {/* ── Reassign modal ── */}
      <ReassignScannerModal
        open={actionModal.open && actionModal.mode === "reassign"}
        scanner={actionModal.scanner}
        isLoading={reassign.isPending}
        onConfirm={handleReassign}
        onClose={closeAction}
      />

      {/* ── Scanner detail modal ── */}
      <ScannerDetailModal
        open={!!viewScannerId}
        scannerId={viewScannerId}
        onClose={() => setViewScannerId(null)}
      />
    </div>
  );
}
