// src/pages/vendor/dashboard/components/DashboardQuickActions.tsx

import { Link } from "react-router-dom";
import { ShoppingCart, Plus, BarChart3, FileText } from "lucide-react";
import { ROUTES } from "../../../../constants/routes";
import { cn } from "../../../../lib/utils";

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  accent: string;
}

const ACTIONS: QuickAction[] = [
  {
    label: "Open counter",
    description: "Start scanning products",
    href: ROUTES.STOREKEEPER,
    icon: <ShoppingCart size={18} />,
    accent:
      "bg-primary-subtle text-primary border-primary-muted hover:bg-primary hover:text-white hover:border-primary",
  },
  {
    label: "Add product",
    description: "Register a new item",
    href: ROUTES.PRODUCTS + "/new",
    icon: <Plus size={18} />,
    accent:
      "bg-success-subtle text-success border-success-muted hover:bg-success hover:text-white hover:border-success",
  },
  {
    label: "View analytics",
    description: "Revenue and trends",
    href: ROUTES.ANALYTICS,
    icon: <BarChart3 size={18} />,
    accent:
      "bg-info-subtle text-info border-info-muted hover:bg-info hover:text-white hover:border-info",
  },
  {
    label: "Get report",
    description: "Download PDF report",
    href: ROUTES.REPORTS,
    icon: <FileText size={18} />,
    accent:
      "bg-warning-subtle text-warning border-warning-muted hover:bg-warning hover:text-white hover:border-warning",
  },
];

export function DashboardQuickActions() {
  return (
    <div className="bg-bg-surface rounded-2xl border border-border p-5">
      <h3 className="font-heading font-bold text-sm text-text-primary mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map((action) => (
          <Link
            key={action.label}
            to={action.href}
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl border",
              "transition-all duration-150 group",
              action.accent,
            )}
          >
            <div className="shrink-0 mt-0.5">{action.icon}</div>
            <div className="min-w-0">
              <div className="text-xs font-semibold leading-snug">
                {action.label}
              </div>
              <div className="text-[10px] opacity-70 mt-0.5 leading-snug">
                {action.description}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
