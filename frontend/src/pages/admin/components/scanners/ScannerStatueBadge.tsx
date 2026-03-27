// src/pages/admin/scanners/components/ScannerStatusBadge.tsx

import type { ScannerStatus } from "../../../../types";

const STYLES: Record<ScannerStatus, string> = {
  available: "bg-success/10 text-success",
  assigned: "bg-info/10    text-info",
  revoked: "bg-warning/10 text-warning",
  retired: "bg-bg-muted   text-text-muted",
};

interface Props {
  status: ScannerStatus;
}

export function ScannerStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STYLES[status] ?? "bg-bg-muted text-text-muted"}`}
    >
      {status}
    </span>
  );
}
