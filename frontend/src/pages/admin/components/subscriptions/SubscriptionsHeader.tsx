// src/pages/admin/subscriptions/components/SubscriptionsHeader.tsx

import { CreditCard } from "lucide-react";

interface Props {
  isLoading?: boolean;
}

export function SubscriptionsHeader({ isLoading }: Props) {
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
            <p className="text-sm text-text-muted">Billing & Plans</p>
            <h1 className="font-heading font-extrabold text-xl text-text-primary mt-0.5">
              Subscriptions
            </h1>
          </>
        )}
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-subtle border border-border text-xs font-semibold text-text-muted">
        <CreditCard size={14} className="text-primary" />
        Admin · Subscriptions
      </div>
    </div>
  );
}
