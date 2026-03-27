// src/pages/vendor/settings/components/SettingsNav.tsx

import { cn } from "../../../../lib/utils";
import { User, Building2, Lock, Scan, CreditCard, Trash2 } from "lucide-react";

export type SettingsTab =
  | "profile"
  | "business"
  | "security"
  | "scanner"
  | "subscription"
  | "danger";

interface NavItem {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "profile", label: "Personal info", icon: <User size={16} /> },
  { id: "business", label: "Business", icon: <Building2 size={16} /> },
  { id: "security", label: "Security", icon: <Lock size={16} /> },
  { id: "scanner", label: "Scanner", icon: <Scan size={16} /> },
  { id: "subscription", label: "Subscription", icon: <CreditCard size={16} /> },
  {
    id: "danger",
    label: "Danger zone",
    icon: <Trash2 size={16} />,
    danger: true,
  },
];

interface SettingsNavProps {
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}

export function SettingsNav({ activeTab, onChange }: SettingsNavProps) {
  return (
    <>
      {/* Desktop sidebar nav */}
      <nav className="hidden lg:flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left",
              "transition-all duration-150",
              activeTab === item.id
                ? item.danger
                  ? "bg-error-subtle text-error border border-error-muted"
                  : "bg-primary-subtle text-primary border border-primary-muted"
                : item.danger
                  ? "text-error hover:bg-error-subtle"
                  : "text-text-muted hover:text-text-primary hover:bg-bg-subtle",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Mobile horizontal scroll nav */}
      <div className="lg:hidden flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1 mb-5">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium shrink-0",
              "transition-all duration-150 border",
              activeTab === item.id
                ? item.danger
                  ? "bg-error-subtle text-error border-error-muted"
                  : "bg-primary-subtle text-primary border-primary-muted"
                : item.danger
                  ? "text-error border-transparent hover:bg-error-subtle"
                  : "text-text-muted border-transparent hover:text-text-primary hover:bg-bg-subtle",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}
