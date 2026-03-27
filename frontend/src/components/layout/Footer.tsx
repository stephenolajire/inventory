// src/pages/landing/Footer.tsx

import { useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import {
  Zap,
  MapPin,
  Mail,
  Phone,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────

const FOOTER_LINKS = {
  product: {
    label: "Product",
    links: [
      { label: "Features",         href: "/#features"      },
      { label: "How it works",     href: "/#how-it-works"  },
      { label: "Pricing",          href: "/#pricing"       },
      { label: "Storekeeper",      href: "/#storekeeper"   },
      { label: "Analytics",        href: "/#analytics"     },
      { label: "PDF Reports",      href: "/#reports"       },
      { label: "Notifications",    href: "/#notifications" },
    ],
  },
  company: {
    label: "Company",
    links: [
      { label: "About us",         href: "/about"          },
      { label: "Blog",             href: "/blog"           },
      { label: "Careers",          href: "/careers",  badge: "Hiring" },
      { label: "Press kit",        href: "/press"          },
      { label: "Contact us",       href: "/contact"        },
    ],
  },
  support: {
    label: "Support",
    links: [
      { label: "Help centre",      href: "/help"           },
      { label: "Getting started",  href: "/docs/start"     },
      { label: "API docs",         href: "/docs/api"       },
      { label: "System status",    href: "/status",  external: true },
      { label: "Report a bug",     href: "/bugs"           },
    ],
  },
  legal: {
    label: "Legal",
    links: [
      { label: "Privacy policy",   href: "/privacy"        },
      { label: "Terms of service", href: "/terms"          },
      { label: "Cookie policy",    href: "/cookies"        },
      { label: "Security",         href: "/security"       },
    ],
  },
};

const SOCIAL_LINKS = [
  {
    label: "Twitter / X",
    href:  "https://twitter.com/stocksense",
    icon:  <Twitter size={16} />,
  },
  {
    label: "LinkedIn",
    href:  "https://linkedin.com/company/stocksense",
    icon:  <Linkedin size={16} />,
  },
  {
    label: "Instagram",
    href:  "https://instagram.com/stocksense",
    icon:  <Instagram size={16} />,
  },
  {
    label: "Facebook",
    href:  "https://facebook.com/stocksense",
    icon:  <Facebook size={16} />,
  },
];

const NIGERIAN_CITIES = [
  "Lagos", "Abuja", "Port Harcourt", "Kano",
  "Ibadan", "Enugu", "Onitsha", "Kaduna",
];

// ─────────────────────────────────────────────────────────────
// Logo
// ─────────────────────────────────────────────────────────────

function FooterLogo() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2 group select-none"
      aria-label="StockSense home"
    >
      <div className="w-8 h-8 rounded-lg bg-green-600 group-hover:bg-green-700 flex items-center justify-center transition-colors duration-150 shadow-md">
        <Zap size={16} className="text-white" fill="white" />
      </div>
      <span className="font-heading font-extrabold text-xl tracking-tight text-text-primary">
        Stock<span className="text-primary">Sense</span>
      </span>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Newsletter signup
// ─────────────────────────────────────────────────────────────

function NewsletterSignup() {
  const [email,     setEmail]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-success-subtle border border-success-muted">
        <CheckCircle2 size={18} className="text-success shrink-0" />
        <div>
          <div className="text-sm font-semibold text-success">
            You are on the list!
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            We will send you product updates and tips — no spam.
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="your@email.com"
            aria-label="Email address for newsletter"
            className={`
              input text-sm h-10
              ${error ? "input-error" : ""}
            `}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="
            btn btn-primary btn-md shrink-0
            disabled:opacity-60 disabled:cursor-not-allowed
            h-10 px-4
          "
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <ArrowRight size={16} />
          )}
        </button>
      </div>
      {error && (
        <p className="text-xs text-error mt-1.5">{error}</p>
      )}
      <p className="text-xs text-text-muted mt-2">
        Product updates and tips. Unsubscribe anytime.
      </p>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// Link column
// ─────────────────────────────────────────────────────────────

interface FooterLinkColumnProps {
  label: string;
  links: {
    label:     string;
    href:      string;
    badge?:    string;
    external?: boolean;
  }[];
}

function FooterLinkColumn({ label, links }: FooterLinkColumnProps) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-text-primary uppercase tracking-widest mb-4">
        {label}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  inline-flex items-center gap-1.5 text-sm text-text-muted
                  hover:text-text-primary transition-colors duration-150
                  group
                "
              >
                {link.label}
                <ExternalLink
                  size={11}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                />
              </a>
            ) : (
              <Link
                to={link.href}
                className="
                  inline-flex items-center gap-2 text-sm text-text-muted
                  hover:text-text-primary transition-colors duration-150
                "
              >
                {link.label}
                {link.badge && (
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-success-subtle text-success border border-success-muted">
                    {link.badge}
                  </span>
                )}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Contact info
// ─────────────────────────────────────────────────────────────

function ContactInfo() {
  return (
    <div className="space-y-3">
      <a
        href="mailto:hello@stocksense.app"
        className="flex items-center gap-2.5 text-sm text-text-muted hover:text-text-primary transition-colors duration-150 group"
      >
        <div className="w-7 h-7 rounded-lg bg-bg-subtle border border-border flex items-center justify-center shrink-0 group-hover:border-primary-muted group-hover:bg-primary-subtle transition-all duration-150">
          <Mail size={13} className="text-text-muted group-hover:text-primary transition-colors duration-150" />
        </div>
        hello@stocksense.app
      </a>

      <a
        href="https://wa.me/2348000000000"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 text-sm text-text-muted hover:text-text-primary transition-colors duration-150 group"
      >
        <div className="w-7 h-7 rounded-lg bg-bg-subtle border border-border flex items-center justify-center shrink-0 group-hover:border-primary-muted group-hover:bg-primary-subtle transition-all duration-150">
          <MessageCircle size={13} className="text-text-muted group-hover:text-primary transition-colors duration-150" />
        </div>
        WhatsApp support
      </a>

      <a
        href="tel:+2348000000000"
        className="flex items-center gap-2.5 text-sm text-text-muted hover:text-text-primary transition-colors duration-150 group"
      >
        <div className="w-7 h-7 rounded-lg bg-bg-subtle border border-border flex items-center justify-center shrink-0 group-hover:border-primary-muted group-hover:bg-primary-subtle transition-all duration-150">
          <Phone size={13} className="text-text-muted group-hover:text-primary transition-colors duration-150" />
        </div>
        +234 800 000 0000
      </a>

      <div className="flex items-start gap-2.5 text-sm text-text-muted">
        <div className="w-7 h-7 rounded-lg bg-bg-subtle border border-border flex items-center justify-center shrink-0 mt-0.5">
          <MapPin size={13} className="text-text-muted" />
        </div>
        <span className="leading-snug">
          Lagos, Nigeria
          <br />
          <span className="text-xs text-text-muted">
            Serving vendors nationwide
          </span>
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Social links
// ─────────────────────────────────────────────────────────────

function SocialLinks() {
  return (
    <div className="flex items-center gap-2">
      {SOCIAL_LINKS.map((social) => (
        <a
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.label}
          className="
            w-9 h-9 rounded-xl border border-border
            flex items-center justify-center
            text-text-muted hover:text-text-primary
            hover:bg-bg-subtle hover:border-border-strong
            transition-all duration-150
          "
        >
          {social.icon}
        </a>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// City presence strip
// ─────────────────────────────────────────────────────────────

function CityStrip() {
  return (
    <div className="py-5 border-t border-border">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <span className="text-xs text-text-muted font-medium uppercase tracking-wider shrink-0">
          Active in
        </span>
        {NIGERIAN_CITIES.map((city) => (
          <div key={city} className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs text-text-muted font-medium">{city}</span>
          </div>
        ))}
        <span className="text-xs text-text-muted font-medium">
          + more cities
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bottom bar
// ─────────────────────────────────────────────────────────────

function BottomBar() {
  const year = new Date().getFullYear();

  return (
    <div className="py-5 border-t border-border">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

        {/* Copyright */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <span>© {year} StockSense Technologies Ltd.</span>
          <span className="hidden sm:inline text-border">·</span>
          <span className="hidden sm:inline">Made with ♥ in Nigeria</span>
        </div>

        {/* Quick legal links */}
        <div className="flex items-center gap-4">
          {[
            { label: "Privacy",  href: "/privacy" },
            { label: "Terms",    href: "/terms"   },
            { label: "Cookies",  href: "/cookies" },
          ].map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="text-xs text-text-muted hover:text-text-primary transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Status badge */}
        <a
          href="/status"
          target="_blank"
          rel="noopener noreferrer"
          className="
            inline-flex items-center gap-1.5 text-xs text-text-muted
            hover:text-text-primary transition-colors duration-150
          "
        >
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          All systems operational
        </a>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Final CTA band above the footer
// ─────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <div
      className="mx-4 sm:mx-6 lg:mx-8 mb-0 rounded-3xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #061F18 0%, #0F6E56 60%, #0a5442 100%)",
      }}
    >
      <div className="relative px-8 py-14 sm:px-12 lg:px-20 lg:py-16 text-center">

        {/* Blobs */}
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #C9A84C, transparent 70%)" }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #ffffff, transparent 70%)" }}
          aria-hidden="true"
        />

        <div className="relative">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-6">
            <Zap size={11} className="text-amber-400" fill="currentColor" />
            <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
              Start today
            </span>
          </div>

          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight mb-4 max-w-2xl mx-auto">
            Your business deserves
            better tools
          </h2>

          <p className="text-green-200 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            Join 2,400+ Nigerian vendors who have replaced
            notebooks and spreadsheets with StockSense.
            Free plan available — no credit card needed.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={ROUTES.REGISTER}
              className="
                inline-flex items-center gap-2
                px-7 py-4 rounded-xl
                text-base font-semibold
                bg-accent text-accent-fg
                hover:bg-accent-hover
                shadow-xl transition-all duration-200
                active:scale-95 group
              "
            >
              <Zap size={16} fill="currentColor" />
              Start for free
              <ArrowRight
                size={16}
                className="group-hover:translate-x-0.5 transition-transform duration-150"
              />
            </Link>

            <Link
              to={ROUTES.LOGIN}
              className="
                inline-flex items-center gap-2
                px-7 py-4 rounded-xl
                text-base font-semibold text-white
                border border-white/25
                hover:bg-white/10 hover:border-white/40
                transition-all duration-200
              "
            >
              Log in to my account
            </Link>
          </div>

          {/* Micro trust */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-7">
            {[
              "No credit card required",
              "Free plan forever",
              "Setup in 5 minutes",
              "Cancel anytime",
            ].map((item, i) => (
              <div key={item} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span className="w-1 h-1 rounded-full bg-white/20 hidden sm:block" />
                )}
                <CheckCircle2 size={12} className="text-green-300" />
                <span className="text-xs text-green-200 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main footer
// ─────────────────────────────────────────────────────────────

export default function Footer() {
  return (
    <footer className="bg-bg-base border-t border-border" aria-label="Site footer">

      {/* Final CTA — sits on top of the footer */}
      <div className="pt-16 pb-0">
        <FinalCTA />
      </div>

      {/* Main footer body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top section */}
        <div className="py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8">

          {/* Brand column — spans 2 cols */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <FooterLogo />

            <p className="text-sm text-text-muted leading-relaxed max-w-xs">
              StockSense is the all-in-one inventory and sales platform
              built for Nigerian SMB vendors. Scan, sell and grow —
              all from one dashboard.
            </p>

            {/* Contact */}
            <ContactInfo />

            {/* Social */}
            <SocialLinks />
          </div>

          {/* Link columns */}
          <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-8">
            <FooterLinkColumn
              label={FOOTER_LINKS.product.label}
              links={FOOTER_LINKS.product.links}
            />
            <FooterLinkColumn
              label={FOOTER_LINKS.company.label}
              links={FOOTER_LINKS.company.links}
            />
            <FooterLinkColumn
              label={FOOTER_LINKS.support.label}
              links={FOOTER_LINKS.support.links}
            />
            <div className="flex flex-col gap-8">
              <FooterLinkColumn
                label={FOOTER_LINKS.legal.label}
                links={FOOTER_LINKS.legal.links}
              />

              {/* Newsletter in legal column on desktop */}
              <div>
                <h3 className="text-xs font-semibold text-text-primary uppercase tracking-widest mb-4">
                  Newsletter
                </h3>
                <NewsletterSignup />
              </div>
            </div>
          </div>
        </div>

        {/* City strip */}
        <CityStrip />

        {/* Bottom bar */}
        <BottomBar />

      </div>
    </footer>
  );
}