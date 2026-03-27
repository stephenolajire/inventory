// src/components/layout/Navbar.tsx

import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useThemeStore } from "../../store/theme.store";
import { ROUTES } from "../../constants/routes";

import {
  Menu,
  X,
  Moon,
  Sun,
  ChevronDown,
  BarChart3,
  ShoppingCart,
  Package,
  FileText,
  Bell,
  Scan,
  Zap,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

interface NavDropdownItem {
  label: string;
  href: string;
  description: string;
  icon: React.ReactNode;
}

interface NavDropdown {
  label: string;
  items: NavDropdownItem[];
}

type NavItem = NavLink | NavDropdown;

function isDropdown(item: NavItem): item is NavDropdown {
  return "items" in item;
}

// ─────────────────────────────────────────────────────────────
// Nav data
// ─────────────────────────────────────────────────────────────

const FEATURES_DROPDOWN: NavDropdownItem[] = [
  {
    label: "Storekeeper",
    href: "/#storekeeper",
    description: "Barcode-powered POS counter screen",
    icon: <ShoppingCart size={18} />,
  },
  {
    label: "Inventory",
    href: "/#inventory",
    description: "Add products, track stock in real time",
    icon: <Package size={18} />,
  },
  {
    label: "Analytics",
    href: "/#analytics",
    description: "Revenue charts, rush hours, top products",
    icon: <BarChart3 size={18} />,
  },
  {
    label: "Reports",
    href: "/#reports",
    description: "Download weekly and monthly PDF reports",
    icon: <FileText size={18} />,
  },
  {
    label: "Notifications",
    href: "/#notifications",
    description: "Low stock alerts, daily summaries",
    icon: <Bell size={18} />,
  },
  {
    label: "Scanner",
    href: "/#scanner",
    description: "Physical barcode scanner integration",
    icon: <Scan size={18} />,
  },
];

const NAV_ITEMS: NavItem[] = [
  { label: "Features", items: FEATURES_DROPDOWN },
  { label: "Pricing", href: "/#pricing" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Nigeria-first", href: "/#nigeria" },
];

// ─────────────────────────────────────────────────────────────
// Logo
// ─────────────────────────────────────────────────────────────

function Logo() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 select-none group"
      aria-label="StockSense home"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-600 group-hover:bg-green-700 transition-colors duration-150 shadow-md">
        <Zap size={16} className="text-white" fill="white" />
      </div>
      <span className="font-heading font-extrabold text-xl tracking-tight text-gray-900 dark:text-gray-50">
        Stock<span className="text-green-600">Sense</span>
      </span>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Theme toggle
// ─────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="
        relative w-9 h-9 rounded-lg flex items-center justify-center
        text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50
        hover:bg-gray-100 dark:hover:bg-gray-800
        border border-transparent hover:border-gray-200 dark:hover:border-gray-700
        transition-all duration-150
      "
    >
      <Sun
        size={18}
        className={`absolute transition-all duration-300 ${
          isDark
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 rotate-90 scale-50"
        }`}
      />
      <Moon
        size={18}
        className={`absolute transition-all duration-300 ${
          isDark
            ? "opacity-0 -rotate-90 scale-50"
            : "opacity-100 rotate-0 scale-100"
        }`}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Dropdown menu
// ─────────────────────────────────────────────────────────────

interface DropdownMenuProps {
  items: NavDropdownItem[];
  isOpen: boolean;
}

function DropdownMenu({ items, isOpen }: DropdownMenuProps) {
  return (
    <div
      role="menu"
      className={`
        absolute top-full left-1/2 -translate-x-1/2 mt-2
        w-130 p-2
        bg-white dark:bg-gray-900
        border border-gray-200 dark:border-gray-700
        rounded-2xl shadow-xl
        transition-all duration-200
        ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }
      `}
    >
      {/* Grid of feature items */}
      <div className="grid grid-cols-2 gap-1">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            role="menuitem"
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-150 group"
          >
            {/* Icon box */}
            <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 group-hover:bg-green-600 dark:group-hover:bg-green-600 group-hover:text-white transition-all duration-150">
              {item.icon}
            </div>

            {/* Text */}
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-50 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-150">
                {item.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                {item.description}
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Footer CTA strip */}
      <div className="mt-2 p-3 rounded-xl bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-900 flex items-center justify-between">
        <span className="text-xs text-green-700 dark:text-green-400 font-medium">
          See all features in action
        </span>
        <Link
          to={ROUTES.REGISTER}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors duration-150"
        >
          Try free →
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Desktop nav item
// ─────────────────────────────────────────────────────────────

interface DesktopNavItemProps {
  item: NavItem;
}

function DesktopNavItem({ item }: DesktopNavItemProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (isDropdown(item)) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          onMouseEnter={() => setOpen(true)}
          aria-haspopup="true"
          aria-expanded={open}
          className={`
            flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
            ${
              open
                ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800"
            }
          `}
        >
          {item.label}
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
          />
        </button>

        <div onMouseLeave={() => setOpen(false)}>
          <DropdownMenu items={item.items} isOpen={open} />
        </div>
      </div>
    );
  }

  return (
    <a
      href={(item as NavLink).href}
      className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150"
    >
      {item.label}
    </a>
  );
}

// ─────────────────────────────────────────────────────────────
// Mobile menu
// ─────────────────────────────────────────────────────────────

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setExpandedDropdown(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <nav>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`
          fixed inset-0 lg:hidden
          bg-black/40 dark:bg-black/60
          transition-opacity duration-300
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        style={{ zIndex: 40 }}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`
          fixed top-0 right-0 h-full w-75 lg:hidden
          bg-white dark:bg-gray-900
          border-l border-gray-200 dark:border-gray-700
          shadow-2xl flex flex-col
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
        style={{ zIndex: 50 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <Logo />
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {NAV_ITEMS.map((item) => {
            if (isDropdown(item)) {
              const isExpanded = expandedDropdown === item.label;
              return (
                <div key={item.label}>
                  {/* Dropdown trigger */}
                  <button
                    onClick={() =>
                      setExpandedDropdown(isExpanded ? null : item.label)
                    }
                    className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150"
                  >
                    {item.label}
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : "rotate-0"}`}
                    />
                  </button>

                  {/* Expandable sub-items */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isExpanded ? "max-h-150 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="pl-3 pb-2 space-y-1">
                      {item.items.map((sub) => (
                        <a
                          key={sub.label}
                          href={sub.href}
                          onClick={onClose}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150 group"
                        >
                          {/* Sub icon */}
                          <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 group-hover:bg-green-600 dark:group-hover:bg-green-600 group-hover:text-white transition-all duration-150">
                            {sub.icon}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-50">
                              {sub.label}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {sub.description}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <a
                key={(item as NavLink).href}
                href={(item as NavLink).href}
                onClick={onClose}
                className="block px-3 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150"
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Footer CTAs */}
        <div className="p-4 space-y-3 border-t border-gray-200 dark:border-gray-700">
          <Link
            to={ROUTES.LOGIN}
            onClick={onClose}
            className="block w-full text-center py-2.5 px-4 rounded-xl text-sm font-medium text-gray-900 dark:text-gray-50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150"
          >
            Log in
          </Link>

          <Link
            to={ROUTES.REGISTER}
            onClick={onClose}
            className="block w-full text-center py-2.5 px-4 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg transition-all duration-150"
          >
            Start free
          </Link>

          {/* Appearance row */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Appearance
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Navbar
// ─────────────────────────────────────────────────────────────

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  // Frosted glass on scroll
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 16);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <header
        style={{ zIndex: 30 }}
        className={`
          fixed top-0 left-0 right-0 transition-all duration-300
          ${
            scrolled
              ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-sm"
              : "bg-transparent"
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Logo */}
          <Logo />

          {/* Desktop nav */}
          <nav
            className="hidden lg:flex items-center gap-1"
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map((item) => (
              <DesktopNavItem
                key={isDropdown(item) ? item.label : (item as NavLink).href}
                item={item}
              />
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle — desktop */}
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>

            {/* Log in — desktop */}
            <Link
              to={ROUTES.LOGIN}
              className="hidden lg:inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-150"
            >
              Log in
            </Link>

            {/* Start free — desktop */}
            <Link
              to={ROUTES.REGISTER}
              className="hidden lg:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg transition-all duration-150"
            >
              <Zap size={14} fill="white" />
              Start free
            </Link>

            {/* Hamburger — mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
