// src/pages/landing/Footer.tsx
import { Link } from "react-router-dom";
import {
  Zap,
  Mail,
  Twitter,
  Linkedin,
  Instagram,
  ArrowRight,
} from "lucide-react";

const FOOTER_LINKS = [
  {
    label: "Product",
    links: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "Analytics", href: "#" },
    ],
  },
  {
    label: "Company",
    links: [
      { name: "About", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Careers", href: "#", badge: "Hiring" },
    ],
  },
  {
    label: "Support",
    links: [
      { name: "Help Centre", href: "#" },
      { name: "API Docs", href: "#" },
      { name: "Security", href: "#" },
    ],
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Zap size={18} className="text-white fill-white" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">
                Stock<span className="text-indigo-400">Sense</span>
              </span>
            </Link>

            <p className="text-sm leading-relaxed max-w-sm">
              The modern inventory platform for UK retailers. Real-time
              tracking, fast scanning, and beautiful reports.
            </p>

            <form
              className="flex max-w-sm gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Enter email for updates"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors">
                <ArrowRight size={18} />
              </button>
            </form>
          </div>

          {/* Link Columns */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.label}>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">
                {group.label}
              </h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm hover:text-indigo-400 transition-colors flex items-center gap-2"
                    >
                      {link.name}
                      {link.badge && (
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                          {link.badge}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-900 mb-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xs space-x-4">
            <span>© {currentYear} StockSense UK Ltd.</span>
            <a href="#" className="hover:text-white">
              Privacy
            </a>
            <a href="#" className="hover:text-white">
              Terms
            </a>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="mailto:hello@stocksense.co.uk"
              className="text-sm hover:text-white flex items-center gap-2"
            >
              <Mail size={14} /> hello@stocksense.co.uk
            </a>
            <div className="flex gap-3">
              <Twitter size={18} className="cursor-pointer hover:text-white" />
              <Linkedin size={18} className="cursor-pointer hover:text-white" />
              <Instagram
                size={18}
                className="cursor-pointer hover:text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
