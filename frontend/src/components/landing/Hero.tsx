// src/pages/landing/HeroSection.tsx

import {
  Printer,
  Store,
  LayoutGrid,
  CheckCircle2,
  Barcode,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Hardware Component: Wide Desktop Monitor
// ─────────────────────────────────────────────────────────────
function ProfessionalMonitor({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col items-center w-full">
      {/* Screen Frame */}
      <div className="relative bg-[#0f172a] p-2 sm:p-3 rounded-2xl sm:rounded-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] border border-slate-800 w-full">
        <div className="bg-white rounded-xl sm:rounded-[14px] overflow-hidden w-full h-64 sm:h-80 lg:h-[500px] flex flex-col shadow-inner">
          {children}
        </div>
        {/* Power LED */}
        <div className="absolute bottom-3 right-4 sm:bottom-4 sm:right-6 w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]" />
      </div>
      {/* Monitor Neck */}
      <div className="w-20 sm:w-28 h-6 sm:h-10 bg-linear-to-b from-slate-800 to-slate-900 -mt-1 shadow-lg" />
      {/* Monitor Base */}
      <div className="w-40 sm:w-56 h-2 sm:h-3 bg-slate-900 rounded-t-2xl shadow-md" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Hardware Component: Desktop Keyboard
// ─────────────────────────────────────────────────────────────
function DesktopKeyboard() {
  return (
    <div className="relative w-full max-w-xs sm:max-w-md lg:max-w-lg h-10 sm:h-14 bg-[#e2e8f0] rounded-lg border-b-[4px] sm:border-b-[5px] border-slate-400 shadow-xl flex items-center justify-around px-4 sm:px-6 mx-auto">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="w-3 sm:w-4 h-2 bg-white rounded-sm shadow-sm opacity-70"
        />
      ))}
      <div className="w-8 sm:w-12 h-2 bg-white/40 rounded-sm" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Hardware Component: Handheld Scanner
// ─────────────────────────────────────────────────────────────
function HandheldScanner() {
  return (
    <div className="relative flex flex-col items-center">
      <div className="w-10 sm:w-14 h-24 sm:h-36 bg-slate-800 rounded-t-3xl rounded-b-xl border-x-[4px] sm:border-x-[6px] border-slate-700 shadow-2xl relative transform rotate-6 hover:rotate-2 transition-transform duration-500">
        <div className="absolute top-3 sm:top-4 left-0 w-full h-1 bg-red-600/40 blur-[2px] animate-pulse" />
        <div className="mt-7 sm:mt-10 flex flex-col items-center gap-2 sm:gap-3">
          <div className="w-4 sm:w-6 h-1.5 bg-slate-600 rounded-full" />
          <div className="w-4 sm:w-6 h-4 sm:h-6 bg-slate-900 rounded-full border border-slate-600 flex items-center justify-center">
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-yellow-500 rounded-full" />
          </div>
        </div>
      </div>
      <div className="w-14 sm:w-20 h-3 sm:h-4 bg-slate-900 rounded-full mt-2 shadow-lg" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Hardware Component: Thermal Printer
// ─────────────────────────────────────────────────────────────
function ThermalPrinter() {
  return (
    <div className="relative flex flex-col items-center">
      <div className="w-24 sm:w-36 h-20 sm:h-28 bg-slate-900 rounded-2xl border-t-2 border-slate-800 shadow-2xl flex flex-col items-center">
        <div className="w-16 sm:w-24 h-4 sm:h-5 bg-slate-950 mt-3 sm:mt-4 rounded-sm border-b border-slate-800" />
        <div className="mt-3 sm:mt-4 flex gap-2">
          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-green-500 rounded-full animate-pulse" />
          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-slate-700 rounded-full" />
        </div>
      </div>
      {/* Animated Receipt */}
      <div className="absolute top-10 sm:top-14 left-1/2 -translate-x-1/2 w-20 sm:w-28 bg-white shadow-xl rounded-b-sm p-2 sm:p-3 animate-[print_4s_infinite] overflow-hidden">
        <div className="flex justify-between mb-1 sm:mb-2">
          <div className="w-6 sm:w-8 h-1.5 bg-slate-200" />
          <div className="w-3 sm:w-4 h-1.5 bg-slate-200" />
        </div>
        <div className="w-full h-1 bg-slate-100 mb-1" />
        <div className="w-full h-1 bg-slate-100 mb-1" />
        <Barcode size={16} className="mx-auto text-slate-300 mt-1 sm:mt-2" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// POS Screen Content — extracted for reuse
// ─────────────────────────────────────────────────────────────
function POSScreen() {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Topbar */}
      <div className="flex items-center justify-between px-3 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-5 bg-slate-50 border-b border-slate-100 shrink-0">
        <div className="flex gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-900 text-white text-[9px] sm:text-[10px] font-black rounded-md sm:rounded-lg">
            <Store size={10} className="shrink-0" /> REGISTER #04
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-[10px] font-black rounded-lg border border-green-100">
            ONLINE SYNC
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-[10px] font-black text-slate-900">
              Sarah Watkins
            </p>
            <p className="text-[9px] text-slate-400">Senior Operator</p>
          </div>
          <div className="w-7 h-7 sm:w-9 sm:h-9 bg-slate-200 rounded-full border-2 border-white shadow-sm shrink-0" />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel */}
        <div className="flex-1 p-3 sm:p-5 lg:p-8 border-r border-slate-50 overflow-y-auto">
          <div className="flex justify-between items-center mb-3 sm:mb-5">
            <h3 className="text-sm sm:text-base lg:text-lg font-black text-slate-900">
              Current Session
            </h3>
            <button className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <LayoutGrid size={14} className="text-slate-400 sm:hidden" />
              <LayoutGrid
                size={18}
                className="text-slate-400 hidden sm:block"
              />
            </button>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {[
              { n: "Organic Oat Milk 1L", p: "£4.50", s: "SS-482" },
              { n: "Free Range Eggs x12", p: "£3.20", s: "SS-491" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 sm:p-3 lg:p-4 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-100"
              >
                <div className="flex gap-2 sm:gap-4 items-center">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-white rounded-md sm:rounded-lg border border-slate-100 shrink-0" />
                  <div>
                    <p className="text-[10px] sm:text-xs font-black text-slate-800 leading-tight">
                      {item.n}
                    </p>
                    <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      {item.s}
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-black text-slate-900 shrink-0 ml-2">
                  {item.p}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-28 sm:w-48 lg:w-72 bg-slate-50/50 p-3 sm:p-5 lg:p-8 flex flex-col shrink-0">
          <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl lg:rounded-2xl border border-slate-100 shadow-sm mb-3 sm:mb-5">
            <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase mb-0.5 sm:mb-1">
              Subtotal
            </p>
            <p className="text-lg sm:text-2xl lg:text-3xl font-[1000] text-slate-900 tracking-tighter">
              £7.70
            </p>
          </div>
          <div className="space-y-2">
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-2 sm:py-3 lg:py-4 rounded-lg lg:rounded-xl flex items-center justify-center gap-1 sm:gap-2 transition-all shadow-lg shadow-green-600/20 text-[10px] sm:text-xs lg:text-sm">
              <CheckCircle2 size={12} className="sm:hidden shrink-0" />
              <CheckCircle2
                size={16}
                className="hidden sm:block lg:hidden shrink-0"
              />
              <CheckCircle2 size={18} className="hidden lg:block shrink-0" />
              COMPLETE
            </button>
            <button className="w-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-bold py-2 sm:py-3 lg:py-4 rounded-lg lg:rounded-xl flex items-center justify-center gap-1 sm:gap-2 transition-all text-[10px] sm:text-xs lg:text-sm">
              <Printer size={12} className="sm:hidden shrink-0" />
              <Printer
                size={16}
                className="hidden sm:block lg:hidden shrink-0"
              />
              <Printer size={18} className="hidden lg:block shrink-0" />
              RECEIPT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Section
// ─────────────────────────────────────────────────────────────
export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-[#f8fafc] pt-20 sm:pt-24 pb-16 sm:pb-32 lg:pb-48 overflow-hidden font-sans">
      {/* Header Copy */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center mb-10 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-green-100 text-green-700 rounded-full text-[10px] sm:text-xs font-black mb-5 sm:mb-8 border border-green-200 shadow-sm">
          <Store size={12} className="shrink-0" /> MULTI-VENDOR ENTERPRISE
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-[5rem] font-bold text-slate-900 leading-[0.9] tracking-tighter mb-6 sm:mb-10">
          Scale your shop with
          <br />
          <span className="text-green-600 mt-3 sm:mt-5 block">StockSense</span>
        </h1>
        <p className="text-slate-500 text-base sm:text-xl max-w-2xl mx-auto font-medium mb-8 sm:mb-12 leading-relaxed px-2">
          The all-in-one workstation for supermarket giants and independent
          vendors. Scan items, manage multi-location inventory, and print
          receipts instantly.
        </p>
      </div>

      {/* ── MOBILE: Stacked layout ── */}
      <div className="lg:hidden px-4 sm:px-6 flex flex-col items-center gap-8">
        {/* Monitor */}
        <div className="w-full max-w-lg flex flex-col items-center">
          <ProfessionalMonitor>
            <POSScreen />
          </ProfessionalMonitor>
          <div className="mt-4 w-full max-w-xs sm:max-w-sm">
            <DesktopKeyboard />
          </div>
        </div>

        {/* Peripherals row on mobile */}
        <div className="flex items-end justify-center gap-16 sm:gap-24">
          <div className="flex flex-col items-center">
            <ThermalPrinter />
            <p className="text-[10px] text-slate-400 font-black mt-12 text-center uppercase tracking-[0.2em]">
              Receipt Unit
            </p>
          </div>
          <div className="flex flex-col items-center">
            <HandheldScanner />
            <p className="text-[10px] text-slate-400 font-black mt-4 text-center uppercase tracking-[0.2em]">
              Laser Scanner
            </p>
          </div>
        </div>
      </div>

      {/* ── DESKTOP: Side-by-side layout ── */}
      <div className="hidden lg:block relative max-w-[1400px] mx-auto px-6 mt-8">
        {/* Surface line */}
        <div className="absolute bottom-0.5 left-0 w-full h-0.5 bg-slate-200/60" />

        <div className="flex items-end justify-between gap-6 xl:gap-10">
          {/* Printer — Left */}
          <div className="pb-1 shrink-0">
            <ThermalPrinter />
            <p className="text-[10px] text-slate-400 font-black mt-16 text-center uppercase tracking-[0.2em]">
              Receipt Unit
            </p>
          </div>

          {/* Monitor & Keyboard — Center */}
          <div className="flex flex-col items-center flex-1 min-w-0">
            <ProfessionalMonitor>
              <POSScreen />
            </ProfessionalMonitor>
            <div className="mt-8 w-full">
              <DesktopKeyboard />
            </div>
          </div>

          {/* Scanner — Right */}
          <div className="pb-1 shrink-0">
            <HandheldScanner />
            <p className="text-[10px] text-slate-400 font-black mt-6 text-center uppercase tracking-[0.2em]">
              Laser Scanner
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes print {
          0%   { height: 0px;  opacity: 0; transform: translateX(-50%) translateY(-20px); }
          15%  { height: 90px; opacity: 1; transform: translateX(-50%) translateY(0); }
          85%  { height: 90px; opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { height: 90px; opacity: 0; transform: translateX(-50%) translateY(30px); }
        }
      `}</style>
    </section>
  );
}
