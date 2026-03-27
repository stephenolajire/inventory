// src/pages/vendor/notifications/components/NotificationsSkeleton.tsx

export function NotificationsSkeleton() {
  return (
    <div className="bg-bg-surface rounded-2xl border border-border overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-4 px-5 py-4 border-b border-border last:border-0 animate-pulse"
        >
          <div className="w-9 h-9 rounded-xl bg-bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-20 bg-bg-muted rounded-full" />
            <div className="h-3.5 w-48 bg-bg-muted rounded-full" />
            <div className="h-3 w-64 bg-bg-muted rounded-full" />
            <div className="h-2.5 w-16 bg-bg-muted rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
