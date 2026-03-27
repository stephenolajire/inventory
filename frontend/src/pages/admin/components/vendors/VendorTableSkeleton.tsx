// src/pages/admin/vendors/components/VendorTableSkeleton.tsx

interface VendorTableSkeletonProps {
  rows?: number;
}

export function VendorTableSkeleton({ rows = 8 }: VendorTableSkeletonProps) {
  return (
    <div className="divide-y divide-border animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-12 gap-3 px-4 py-3.5 items-center"
        >
          {/* Avatar + name */}
          <div className="col-span-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-bg-muted shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-28 bg-bg-muted rounded-full" />
              <div className="h-2.5 w-36 bg-bg-muted rounded-full" />
            </div>
          </div>
          {/* Type */}
          <div className="col-span-2">
            <div className="h-3 w-16 bg-bg-muted rounded-full" />
          </div>
          {/* Location */}
          <div className="col-span-2">
            <div className="h-3 w-20 bg-bg-muted rounded-full" />
          </div>
          {/* Status */}
          <div className="col-span-2">
            <div className="h-5 w-16 bg-bg-muted rounded-lg" />
          </div>
          {/* Actions */}
          <div className="col-span-2 flex justify-end gap-1.5">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="w-7 h-7 rounded-lg bg-bg-muted" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
