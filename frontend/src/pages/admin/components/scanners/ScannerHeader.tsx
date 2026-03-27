// src/pages/admin/scanners/components/ScannersHeader.tsx

import { ScanLine } from "lucide-react";

interface ScannersHeaderProps {
  isLoading?: boolean;
}

export function ScannersHeader({ isLoading }: ScannersHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        {isLoading ? (
          <div className="animate-pulse space-y-1.5">
            <div className="h-4 w-36 bg-bg-muted rounded-full" />
            <div className="h-6 w-52 bg-bg-muted rounded-full" />
          </div>
        ) : (
          <>
            <p className="text-sm text-text-muted">Hardware Management</p>
            <h1 className="font-heading font-extrabold text-xl text-text-primary mt-0.5">
              Scanner Pool
            </h1>
          </>
        )}
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-subtle border border-border text-xs font-semibold text-text-muted">
        <ScanLine size={14} className="text-primary" />
        Admin · Scanners
      </div>
    </div>
  );
}
