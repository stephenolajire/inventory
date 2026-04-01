// src/components/layout/Navbar.tsx

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routes";

import {
  Menu,
  X,
  ChevronDown,
  BarChart3,
  ShoppingCart,
  Package,
  Scan,
  Zap,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface NavLink {
  label: string;
  href: string;
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
// Nav data (Updated Sections)
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
    description: "Revenue charts and top products",
    icon: <BarChart3 size={18} />,
  },
  {
    label: "Scanner",
    href: "/#scanner",
    description: "Physical barcode scanner integration",
    icon: <Scan size={18} />,
  },
];

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Features", items: FEATURES_DROPDOWN },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Testimonials", href: "/#testimonials" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Contact", href: "/contact" }, // Pointing to a page as requested
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
      <span className="font-heading font-extrabold text-xl tracking-tight text-gray-900">
        Stock<span className="text-green-600">Sense</span>
      </span>
    </Link>
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
        w-80 p-2
        bg-white border border-gray-200
        rounded-2xl shadow-xl
        transition-all duration-200
        ${isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"}
      `}
    >
      <div className="grid grid-cols-1 gap-1">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            role="menuitem"
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-150 group"
          >
            <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all duration-150">
              {item.icon}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                {item.label}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                {item.description}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Desktop nav item
// ─────────────────────────────────────────────────────────────

function DesktopNavItem({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (isDropdown(item)) {
    return (
      <div ref={ref} className="relative">
        <button
          onMouseEnter={() => setOpen(true)}
          className={`
            flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-bold transition-all duration-150
            ${open ? "text-green-600 bg-green-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}
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
      className="px-3 py-2 rounded-lg text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
    >
      {item.label}
    </a>
  );
}

// ─────────────────────────────────────────────────────────────
// Mobile menu
// ─────────────────────────────────────────────────────────────

function MobileMenu({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <nav>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 z-40 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out z-50 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b">
          <Logo />
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={isDropdown(item) ? "#" : (item as NavLink).href}
              className="block px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-green-600 transition-all"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="p-6 border-t space-y-3">
          <Link
            to={ROUTES.LOGIN}
            className="block w-full text-center py-3 text-sm font-bold text-gray-900 border rounded-xl hover:bg-gray-50 transition-all"
          >
            Log in
          </Link>
          <Link
            to={ROUTES.REGISTER}
            className="block w-full text-center py-3 text-sm font-bold bg-green-600 text-white rounded-xl shadow-lg shadow-green-600/20"
          >
            Start free
          </Link>
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 transition-all duration-300 z-30 ${scrolled ? "bg-white/80 backdrop-blur-md border-b shadow-sm py-3" : "bg-transparent py-5"}`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Logo />

          <nav className="hidden lg:flex items-center gap-2">
            {NAV_ITEMS.map((item) => (
              <DesktopNavItem key={item.label} item={item} />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.LOGIN}
              className="hidden lg:inline-flex px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-all"
            >
              Log in
            </Link>
            <Link
              to={ROUTES.REGISTER}
              className="hidden lg:inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all"
            >
              <Zap size={14} fill="currentColor" />
              Start free
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-gray-600"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
