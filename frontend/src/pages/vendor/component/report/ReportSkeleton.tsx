// src/pages/vendor/reports/components/ReportsSkeleton.tsx

export function ReportsSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-bg-surface rounded-2xl border border-border p-5 animate-pulse"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-bg-muted" />
              <div className="space-y-1.5">
                <div className="h-3 w-14 bg-bg-muted rounded-full" />
                <div className="h-4 w-32 bg-bg-muted rounded-full" />
              </div>
            </div>
            <div className="h-6 w-20 bg-bg-muted rounded-xl" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="h-3 w-12 bg-bg-muted rounded-full" />
            <div className="h-3 w-24 bg-bg-muted rounded-full" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-9 bg-bg-muted rounded-xl" />
            <div className="w-9 h-9 bg-bg-muted rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
