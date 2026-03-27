// src/pages/landing/HeroSection.tsx

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import {
  ArrowRight,
  TrendingUp,
  Package,
  Scan,
  CheckCircle2,
  Star,
  Zap,
  Users,
  ChevronUp,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────

const C = {
  bg: "#ffffff",
  surface: "#f9f9f8",
  border: "#e8e8e6",
  borderStrong: "#d0d0cc",
  text: "#0e0e0d",
  textSub: "#6b6b68",
  textMuted: "#a3a3a0",
  green: "#0f6e56",
  greenLight: "rgba(15,110,86,0.08)",
  greenBorder: "rgba(15,110,86,0.18)",
};

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────

const STATS = [
  { value: "12,400+", label: "Active vendors", icon: Users },
  { value: "£2.1B+", label: "Revenue tracked", icon: TrendingUp },
  { value: "980k+", label: "Products managed", icon: Package },
  { value: "99.9%", label: "Uptime SLA", icon: Zap },
];

const SOCIAL_PROOF = [
  { initials: "AO", bg: "#d1fae5", fg: "#065f46" },
  { initials: "NK", bg: "#fef3c7", fg: "#92400e" },
  { initials: "EB", bg: "#dbeafe", fg: "#1e40af" },
  { initials: "FD", bg: "#ede9fe", fg: "#5b21b6" },
  { initials: "CI", bg: "#fce7f3", fg: "#9d174d" },
];

interface CartItem {
  name: string;
  qty: number;
  price: number;
  emoji: string;
}

const DEMO_CARTS: { label: string; items: CartItem[] }[] = [
  {
    label: "Till 1",
    items: [
      { name: "Oat Milk 1L", qty: 3, price: 1.89, emoji: "🥛" },
      { name: "Sourdough Loaf", qty: 1, price: 2.5, emoji: "🍞" },
      { name: "Free Range Eggs ×6", qty: 2, price: 2.1, emoji: "🥚" },
      { name: "Cold Brew Coffee", qty: 1, price: 3.2, emoji: "☕" },
    ],
  },
  {
    label: "Till 2",
    items: [
      { name: "Cheddar 400g", qty: 1, price: 3.75, emoji: "🧀" },
      { name: "Chicken Breast 500g", qty: 2, price: 4.2, emoji: "🍗" },
      { name: "Sparkling Water", qty: 4, price: 0.89, emoji: "💧" },
      { name: "Granola Bar ×5", qty: 1, price: 2.6, emoji: "🌾" },
    ],
  },
  {
    label: "Till 3",
    items: [
      { name: "Protein Shake", qty: 2, price: 3.5, emoji: "💪" },
      { name: "Mixed Salad Bag", qty: 1, price: 1.4, emoji: "🥗" },
      { name: "Greek Yoghurt", qty: 3, price: 1.2, emoji: "🫙" },
      { name: "Dark Chocolate 85%", qty: 2, price: 2.8, emoji: "🍫" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// POS Mockup — clean light UI
// ─────────────────────────────────────────────────────────────

function POSMockup() {
  const [till, setTill] = useState(0);
  const [paid, setPaid] = useState([false, false, false]);
  const [animKey, setKey] = useState(0);

  function switchTill(i: number) {
    if (i === till) return;
    setTill(i);
    setKey((k) => k + 1);
  }

  function handlePay() {
    if (paid[till]) return;
    const t = till;
    setPaid((p) => p.map((v, i) => (i === t ? true : v)));
    setTimeout(
      () => setPaid((p) => p.map((v, i) => (i === t ? false : v))),
      2800,
    );
  }

  const cart = DEMO_CARTS[till];
  const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
  const isPaid = paid[till];

  return (
    <div
      style={{
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.08)",
      }}
    >
      {/* Window bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "11px 16px",
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ display: "flex", gap: "6px" }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span
              key={c}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: c,
                display: "block",
              }}
            />
          ))}
        </div>
        <span
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: "11px",
            fontWeight: 600,
            color: C.textMuted,
            letterSpacing: "0.04em",
          }}
        >
          StockSense · Point of Sale
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "10px",
            fontWeight: 600,
            color: C.green,
            background: C.greenLight,
            padding: "3px 8px",
            borderRadius: "999px",
            border: `1px solid ${C.greenBorder}`,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: C.green,
              display: "block",
            }}
          />
          Live
        </div>
      </div>

      {/* Till tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${C.border}`,
          background: C.surface,
        }}
      >
        {DEMO_CARTS.map((c, i) => (
          <button
            key={c.label}
            onClick={() => switchTill(i)}
            onMouseEnter={() => switchTill(i)}
            style={{
              flex: 1,
              padding: "10px 8px",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: till === i ? C.green : C.textMuted,
              borderBottom:
                till === i ? `2px solid ${C.green}` : "2px solid transparent",
              transition: "all 0.15s",
              position: "relative",
            }}
          >
            {paid[i] && (
              <span
                style={{
                  position: "absolute",
                  top: 7,
                  right: 8,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: C.green,
                }}
              />
            )}
            {c.label}
          </button>
        ))}
      </div>

      {/* Items */}
      <div key={animKey} style={{ animation: "ssSlide 0.18s ease-out" }}>
        {cart.items.map((item, idx) => (
          <div
            key={item.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              borderBottom:
                idx < cart.items.length - 1 ? `1px solid ${C.border}` : "none",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: C.surface,
                borderRadius: "8px",
                flexShrink: 0,
                border: `1px solid ${C.border}`,
              }}
            >
              {item.emoji}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: C.text,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.name}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: C.textMuted,
                  marginTop: "1px",
                }}
              >
                £{item.price.toFixed(2)} × {item.qty}
              </div>
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: C.text,
                flexShrink: 0,
              }}
            >
              £{(item.price * item.qty).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "14px 16px",
          borderTop: `1px solid ${C.border}`,
          background: C.surface,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "12px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: C.textMuted,
                marginBottom: "3px",
              }}
            >
              Order Total
            </div>
            <div style={{ fontSize: "11px", color: C.textMuted }}>
              {cart.items.length} items
            </div>
          </div>
          <div
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: C.text,
              letterSpacing: "-0.03em",
            }}
          >
            £{total.toFixed(2)}
          </div>
        </div>
        <button
          onClick={handlePay}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "7px",
            padding: "11px",
            borderRadius: "8px",
            border: "none",
            fontSize: "13px",
            fontWeight: 700,
            cursor: isPaid ? "default" : "pointer",
            transition: "all 0.3s",
            background: isPaid ? C.greenLight : C.green,
            color: isPaid ? C.green : "#fff",
            boxShadow: isPaid ? "none" : `0 2px 12px rgba(15,110,86,0.28)`,
          }}
        >
          {isPaid ? (
            <>
              <CheckCircle2 size={13} /> Payment Complete
            </>
          ) : (
            <>
              <ArrowRight size={13} /> Mark as Paid
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes ssSlide {
          from { opacity:0; transform:translateY(4px); }
          to   { opacity:1; transform:translateY(0);   }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const fade = (delay: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(14px)",
    transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
  });

  return (
    <section
      style={{
        background: C.bg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Main content ── */}
      <div
        style={{
          flex: 1,
          maxWidth: "1280px",
          margin: "0 auto",
          width: "100%",
          padding: "100px 48px 72px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "80px",
          alignItems: "center",
        }}
        className="ss-hero-grid"
      >
        {/* LEFT */}
        <div>
          {/* Badge */}
          <div
            style={{
              ...fade(80),
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: C.greenLight,
              border: `1px solid ${C.greenBorder}`,
              borderRadius: "999px",
              padding: "5px 12px 5px 5px",
              marginBottom: "32px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                background: C.green,
                color: "#fff",
                padding: "2px 8px",
                borderRadius: "999px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              New
            </span>
            <span
              style={{ fontSize: "12px", color: C.textSub, fontWeight: 500 }}
            >
              Analytics Dashboard v2 — now live
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              ...fade(160),
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2.6rem, 4vw, 4.4rem)",
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
              color: C.text,
              marginBottom: "22px",
            }}
          >
            Run your shop.
            <br />
            Know your{" "}
            <span
              style={{
                color: C.green,
                position: "relative",
                display: "inline-block",
              }}
            >
              numbers.
              <svg
                style={{
                  position: "absolute",
                  bottom: "-4px",
                  left: 0,
                  width: "100%",
                  height: "8px",
                }}
                viewBox="0 0 200 8"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 6 Q50 1 100 5 Q150 9 200 3"
                  stroke={C.green}
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.4"
                />
              </svg>
            </span>
          </h1>

          {/* Body */}
          <p
            style={{
              ...fade(240),
              fontSize: "16px",
              lineHeight: 1.75,
              color: C.textSub,
              marginBottom: "36px",
              maxWidth: "440px",
            }}
          >
            The all-in-one inventory and POS platform for{" "}
            <strong style={{ color: C.text, fontWeight: 600 }}>
              UK independent retailers
            </strong>
            . Scan, track stock, collect payments and see your revenue — from
            one clean dashboard.
          </p>

          {/* Feature list */}
          <div
            style={{
              ...fade(310),
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "9px 24px",
              marginBottom: "40px",
            }}
          >
            {[
              "Barcode scanning at the counter",
              "Real-time stock tracking",
              "Analytics & revenue dashboard",
              "Low-stock alerts via email",
              "Multi-payment method support",
              "PDF receipts & reports",
            ].map((f) => (
              <div
                key={f}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <CheckCircle2
                  size={12}
                  color={C.green}
                  style={{ flexShrink: 0 }}
                />
                <span style={{ fontSize: "13px", color: C.textSub }}>{f}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div
            style={{
              ...fade(380),
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "40px",
            }}
          >
            <Link
              to={ROUTES.REGISTER}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: C.green,
                color: "#fff",
                padding: "13px 24px",
                borderRadius: "9px",
                fontWeight: 700,
                fontSize: "14px",
                textDecoration: "none",
                boxShadow: `0 2px 16px rgba(15,110,86,0.30)`,
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#0d5c47";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 4px 24px rgba(15,110,86,0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = C.green;
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 2px 16px rgba(15,110,86,0.30)";
              }}
            >
              <Zap size={13} fill="#fff" /> Start for free{" "}
              <ArrowRight size={13} />
            </Link>

            <a
              href="#demo"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "transparent",
                color: C.textSub,
                padding: "13px 20px",
                borderRadius: "9px",
                fontWeight: 600,
                fontSize: "14px",
                textDecoration: "none",
                border: `1px solid ${C.border}`,
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  C.borderStrong;
                (e.currentTarget as HTMLElement).style.color = C.text;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = C.border;
                (e.currentTarget as HTMLElement).style.color = C.textSub;
              }}
            >
              See a demo
            </a>
          </div>

          {/* Social proof */}
          <div
            style={{
              ...fade(450),
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex" }}>
              {SOCIAL_PROOF.map((av, i) => (
                <div
                  key={av.initials}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: av.bg,
                    border: `2px solid ${C.bg}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    fontWeight: 800,
                    color: av.fg,
                    marginLeft: i > 0 ? "-9px" : "0",
                    zIndex: SOCIAL_PROOF.length - i,
                    position: "relative",
                  }}
                >
                  {av.initials}
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: "flex", gap: "2px", marginBottom: "3px" }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={10} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <div style={{ fontSize: "12px", color: C.textMuted }}>
                <span style={{ color: C.text, fontWeight: 700 }}>12,400+</span>{" "}
                retailers across the UK
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div
          style={{
            ...fade(280),
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Metric row */}
          <div style={{ display: "flex", gap: "12px" }}>
            {[
              {
                icon: TrendingUp,
                label: "Revenue today",
                value: "£8,240",
                delta: "+18%",
                color: C.green,
              },
              {
                icon: Package,
                label: "Products in stock",
                value: "1,847",
                delta: "+43 SKUs",
                color: "#3b82f6",
              },
            ].map(({ icon: Icon, label, value, delta, color }) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "7px",
                      background:
                        color === C.green
                          ? C.greenLight
                          : "rgba(59,130,246,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={13} color={color} />
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      color: C.textMuted,
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: C.text,
                    letterSpacing: "-0.02em",
                    marginBottom: "3px",
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: C.green,
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                  }}
                >
                  <ChevronUp size={11} />
                  {delta} this month
                </div>
              </div>
            ))}
          </div>

          {/* POS */}
          <POSMockup />

          {/* Hint */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "8px",
            }}
          >
            <Scan size={12} color={C.textMuted} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: C.textMuted }}>
              Hover a till tab to switch — just like a real counter
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ borderTop: `1px solid ${C.border}` }}>
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            padding: "0 48px",
          }}
          className="ss-stats-grid"
        >
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                style={{
                  padding: "22px 0",
                  borderRight:
                    i < STATS.length - 1 ? `1px solid ${C.border}` : "none",
                  paddingLeft: i > 0 ? "32px" : "0",
                  paddingRight: i < STATS.length - 1 ? "32px" : "0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "6px",
                  }}
                >
                  <Icon size={11} color={C.green} />
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: C.textMuted,
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: C.text,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {s.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .ss-hero-grid  { grid-template-columns: 1fr !important; padding: 80px 24px 56px !important; gap: 48px !important; }
          .ss-stats-grid { grid-template-columns: repeat(2,1fr) !important; padding: 0 24px !important; }
        }
        @media (max-width: 640px) {
          .ss-hero-grid  { padding: 72px 16px 48px !important; }
          .ss-stats-grid { padding: 0 16px !important; }
        }
      `}</style>
    </section>
  );
}
