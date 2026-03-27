// src/components/layout/VendorSidebar.tsx

import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { useUnreadCount } from "../../hooks/vendor/useVendorNotification";
import { useThemeStore } from "../../store/theme.store";
import { ROUTES } from "../../constants/routes";
import { cn, getInitials, getAvatarColor, truncate } from "../../lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Bell,
  Settings,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  CreditCard,
  Menu,
  X,
  Wallet,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  end?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// ─────────────────────────────────────────────────────────────
// Nav config
// ─────────────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [
      {
        label: "Dashboard",
        href: ROUTES.DASHBOARD,
        icon: <LayoutDashboard size={18} />,
        end: true,
      },
      {
        label: "Storekeeper",
        href: ROUTES.STOREKEEPER,
        icon: <ShoppingCart size={18} />,
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        label: "Products",
        href: ROUTES.PRODUCTS,
        icon: <Package size={18} />,
      }
    ],
  },
  {
    label: "Insights",
    items: [
      {
        label: "Sales",
        href: ROUTES.SALES,
        icon: <Wallet size={18} />,
      },
      {
        label: "Reports",
        href: ROUTES.REPORTS,
        icon: <FileText size={18} />,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        label: "Notifications",
        href: ROUTES.NOTIFICATIONS,
        icon: <Bell size={18} />,
      },
      {
        label: "Subscription",
        href: ROUTES.SUBSCRIPTION,
        icon: <CreditCard size={18} />,
      },
      {
        label: "Settings",
        href: ROUTES.SETTINGS,
        icon: <Settings size={18} />,
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Logo
// ─────────────────────────────────────────────────────────────

function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      to={ROUTES.DASHBOARD}
      className="flex items-center gap-2.5 select-none group overflow-hidden"
      aria-label="StockSense dashboard"
    >
      <div className="w-8 h-8 rounded-lg bg-green-600 group-hover:bg-green-700 flex items-center justify-center shrink-0 transition-colors duration-150 shadow-md">
        <Zap size={16} className="text-white" fill="white" />
      </div>
      <span
        className={cn(
          "font-heading font-extrabold text-lg tracking-tight text-text-primary whitespace-nowrap transition-all duration-300 overflow-hidden",
          collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
        )}
      >
        Stock<span className="text-primary">Sense</span>
      </span>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Nav item
// ─────────────────────────────────────────────────────────────

interface NavItemProps {
  item: NavItem;
  collapsed: boolean;
  onClick?: () => void;
}

function SidebarNavItem({ item, collapsed, onClick }: NavItemProps) {
  const { pathname } = useLocation();

  const isActive = item.end
    ? pathname === item.href
    : pathname.startsWith(item.href);

  return (
    <Link
      to={item.href}
      onClick={onClick}
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl",
        "text-sm font-medium transition-all duration-150 group",
        "overflow-hidden",
        isActive
          ? "bg-primary text-white shadow-md"
          : "text-text-muted hover:text-text-primary hover:bg-bg-subtle",
      )}
    >
      {/* Icon */}
      <span className="shrink-0">{item.icon}</span>

      {/* Label */}
      <span
        className={cn(
          "whitespace-nowrap transition-all duration-300 overflow-hidden",
          collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
        )}
      >
        {item.label}
      </span>

      {/* Badge */}
      {item.badge && item.badge > 0 && (
        <span
          className={cn(
            "shrink-0 ml-auto min-w-4.5 h-4.5 rounded-full",
            "flex items-center justify-center",
            "text-[10px] font-bold leading-none",
            "transition-all duration-300",
            isActive ? "bg-white text-primary" : "bg-error text-white",
            collapsed ? "absolute top-1.5 right-1.5 w-2 h-2 min-w-0" : "",
          )}
        >
          {!collapsed && (item.badge > 99 ? "99+" : item.badge)}
        </span>
      )}

      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-l-full bg-white/40" />
      )}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Nav group
// ─────────────────────────────────────────────────────────────

interface NavGroupProps {
  group: NavGroup;
  collapsed: boolean;
  unreadCount: number;
  onItemClick?: () => void;
}

function SidebarNavGroup({
  group,
  collapsed,
  unreadCount,
  onItemClick,
}: NavGroupProps) {
  return (
    <div className="space-y-0.5">
      {/* Group label */}
      <div
        className={cn(
          "px-3 mb-1 transition-all duration-300 overflow-hidden",
          collapsed ? "h-0 opacity-0" : "h-5 opacity-100",
        )}
      >
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
          {group.label}
        </span>
      </div>

      {/* Group divider when collapsed */}
      {collapsed && <div className="h-px bg-border mx-2 mb-2" />}

      {/* Items */}
      {group.items.map((item) => {
        const badge = item.label === "Notifications" ? unreadCount : item.badge;
        return (
          <SidebarNavItem
            key={item.href}
            item={{ ...item, badge }}
            collapsed={collapsed}
            onClick={onItemClick}
          />
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// User section
// ─────────────────────────────────────────────────────────────

interface UserSectionProps {
  collapsed: boolean;
  onLogout: () => void;
}

function SidebarUserSection({ collapsed, onLogout }: UserSectionProps) {
  const user = useAuthStore((s) => s.user);
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  const fullName = user
    ? `${(user as any).first_name ?? ""} ${(user as any).last_name ?? ""}`.trim() ||
      user.email
    : "";
  const initials = getInitials(fullName || user?.email || "?");
  const avatarColor = getAvatarColor(user?.email ?? "");

  return (
    <div className="border-t border-border pt-3 space-y-1">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
          "text-sm font-medium text-text-muted",
          "hover:text-text-primary hover:bg-bg-subtle",
          "transition-all duration-150 overflow-hidden",
        )}
      >
        <span className="shrink-0">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </span>
        <span
          className={cn(
            "whitespace-nowrap transition-all duration-300 overflow-hidden",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
          )}
        >
          {isDark ? "Light mode" : "Dark mode"}
        </span>
      </button>

      {/* User info + logout */}
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl",
          "hover:bg-bg-subtle transition-all duration-150 overflow-hidden",
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center",
            "text-white text-xs font-bold shrink-0",
            avatarColor,
          )}
        >
          {initials}
        </div>

        {/* Name + email */}
        <div
          className={cn(
            "flex-1 min-w-0 transition-all duration-300 overflow-hidden",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
          )}
        >
          <div className="text-xs font-semibold text-text-primary truncate">
            {truncate(fullName, 20)}
          </div>
          <div className="text-[10px] text-text-muted truncate">
            {truncate(user?.email ?? "", 24)}
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={onLogout}
          aria-label="Log out"
          title="Log out"
          className={cn(
            "shrink-0 w-7 h-7 rounded-lg",
            "flex items-center justify-center",
            "text-text-muted hover:text-error",
            "hover:bg-error-subtle",
            "transition-all duration-150",
            collapsed ? "hidden" : "flex",
          )}
        >
          <LogOut size={14} />
        </button>
      </div>

      {/* Logout button when collapsed */}
      {collapsed && (
        <button
          onClick={onLogout}
          aria-label="Log out"
          title="Log out"
          className="
            w-full flex items-center justify-center
            px-3 py-2.5 rounded-xl
            text-text-muted hover:text-error
            hover:bg-error-subtle
            transition-all duration-150
          "
        >
          <LogOut size={18} />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Collapse toggle button
// ─────────────────────────────────────────────────────────────

function CollapseButton({
  collapsed,
  onClick,
}: {
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="
        w-full flex items-center justify-center
        py-2 rounded-xl
        text-text-muted hover:text-text-primary
        hover:bg-bg-subtle
        transition-all duration-150
        border border-border
      "
    >
      {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar inner — shared between desktop and mobile
// ─────────────────────────────────────────────────────────────

interface SidebarInnerProps {
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
  onItemClick?: () => void;
  showToggle: boolean;
}

function SidebarInner({
  collapsed,
  onToggle,
  onLogout,
  onItemClick,
  showToggle,
}: SidebarInnerProps) {
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.data?.unread_count ?? 0;

  return (
    <div className="flex flex-col h-full px-3 py-4 gap-2">
      {/* Logo */}
      <div className="px-0 mb-2">
        <SidebarLogo collapsed={collapsed} />
      </div>

      {/* Nav groups — scrollable */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 scrollbar-hide">
        {NAV_GROUPS.map((group) => (
          <SidebarNavGroup
            key={group.label}
            group={group}
            collapsed={collapsed}
            unreadCount={unreadCount}
            onItemClick={onItemClick}
          />
        ))}
      </nav>

      {/* User section */}
      <SidebarUserSection collapsed={collapsed} onLogout={onLogout} />

      {/* Collapse toggle — desktop only */}
      {showToggle && (
        <CollapseButton collapsed={collapsed} onClick={onToggle} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main sidebar component
// ─────────────────────────────────────────────────────────────

interface VendorSidebarProps {
  onLogout: () => void;
}

export default function VendorSidebar({ onLogout }: VendorSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const { pathname } = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile drawer on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* ── Mobile hamburger trigger ── */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className="
          lg:hidden fixed top-4 left-4 z-30
          w-9 h-9 rounded-xl
          flex items-center justify-center
          bg-bg-surface border border-border
          text-text-muted hover:text-text-primary
          shadow-sm transition-all duration-150
        "
      >
        <Menu size={20} />
      </button>

      {/* ── Mobile overlay ── */}
      <div
        ref={overlayRef}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 bg-black/40 lg:hidden",
          "transition-opacity duration-300",
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        style={{ zIndex: 40 }}
      />

      {/* ── Mobile drawer ── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          "fixed top-0 left-0 h-full w-64 lg:hidden",
          "bg-bg-surface border-r border-border shadow-2xl",
          "transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ zIndex: 50 }}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
          className="
            absolute top-4 right-4
            w-8 h-8 rounded-lg
            flex items-center justify-center
            text-text-muted hover:text-text-primary
            hover:bg-bg-subtle
            transition-all duration-150
          "
        >
          <X size={18} />
        </button>

        <SidebarInner
          collapsed={false}
          onToggle={() => {}}
          onLogout={() => {
            setMobileOpen(false);
            onLogout();
          }}
          onItemClick={() => setMobileOpen(false)}
          showToggle={false}
        />
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col",
          "fixed top-0 left-0 h-full",
          "bg-bg-surface border-r border-border",
          "transition-all duration-300 ease-in-out",
          collapsed ? "w-17" : "w-60",
        )}
        style={{ zIndex: 20 }}
      >
        <SidebarInner
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
          onLogout={onLogout}
          showToggle={true}
        />
      </aside>

      {/* ── Layout spacer — pushes page content right ── */}
      <div
        className={cn(
          "hidden lg:block shrink-0 transition-all duration-300",
          collapsed ? "w-17" : "w-60",
        )}
        aria-hidden="true"
      />
    </>
  );
}
