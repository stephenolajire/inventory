// src/pages/landing/HeroSection.tsx

import {
  Printer,
  // ChevronRight,
  Store,
  LayoutGrid,
  CheckCircle2,
  Barcode,
} from "lucide-react";
// import { Link } from "react-router-dom";
// import { ROUTES } from "../../constants/routes";

// ─────────────────────────────────────────────────────────────
// Hardware Component: Wide Desktop Monitor
// ─────────────────────────────────────────────────────────────
function ProfessionalMonitor({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Screen Frame - Increased max-width for "Wider" look */}
      <div className="relative bg-[#0f172a] p-3 rounded-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] border border-slate-800">
        <div className="bg-white rounded-[14px] overflow-hidden w-full md:w-230 h-125 flex flex-col shadow-inner">
          {children}
        </div>
        {/* Power LED */}
        <div className="absolute bottom-4 right-6 w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]" />
      </div>
      {/* Monitor Neck */}
      <div className="w-28 h-10 bg-linear-to-b from-slate-800 to-slate-900 -mt-1 shadow-lg" />
      {/* Monitor Base */}
      <div className="w-56 h-3 bg-slate-900 rounded-t-2xl shadow-md" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Hardware Component: Desktop Peripherals
// ─────────────────────────────────────────────────────────────
function DesktopKeyboard() {
  return (
    <div className="relative w-125 h-15 bg-[#e2e8f0] rounded-lg border-b-[5px] border-slate-400 shadow-xl flex items-center justify-around px-6">
      {[...Array(16)].map((_, i) => (
        <div
          key={i}
          className="w-4 h-2.5 bg-white rounded-sm shadow-sm opacity-70"
        />
      ))}
      <div className="w-12 h-2.5 bg-white/40 rounded-sm" />{" "}
      {/* Spacebar area */}
    </div>
  );
}

function HandheldScanner() {
  return (
    <div className="relative flex flex-col items-center">
      <div className="w-14 h-36 bg-slate-800 rounded-t-3xl rounded-b-xl border-x-[6px] border-slate-700 shadow-2xl relative transform rotate-6 hover:rotate-2 transition-transform duration-500">
        <div className="absolute top-4 left-0 w-full h-1 bg-red-600/40 blur-[2px] animate-pulse" />
        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="w-6 h-1.5 bg-slate-600 rounded-full" />
          <div className="w-6 h-6 bg-slate-900 rounded-full border border-slate-600 flex items-center justify-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
          </div>
        </div>
      </div>
      <div className="w-20 h-4 bg-slate-900 rounded-full mt-2 shadow-lg" />
    </div>
  );
}

function ThermalPrinter() {
  return (
    <div className="relative flex flex-col items-center">
      <div className="w-36 h-28 bg-slate-900 rounded-2xl border-t-2,.5 border-slate-800 shadow-2xl flex flex-col items-center">
        <div className="w-24 h-5 bg-slate-950 mt-4 rounded-sm border-b border-slate-800" />
        <div className="mt-4 flex gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-slate-700 rounded-full" />
        </div>
      </div>
      {/* Animated Receipt */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 w-28 bg-white shadow-xl rounded-b-sm p-3 animate-[print_4s_infinite] overflow-hidden">
        <div className="flex justify-between mb-2">
          <div className="w-8 h-1.5 bg-slate-200" />
          <div className="w-4 h-1.5 bg-slate-200" />
        </div>
        <div className="w-full h-1 bg-slate-100 mb-1" />
        <div className="w-full h-1 bg-slate-100 mb-1" />
        <Barcode size={20} className="mx-auto text-slate-300 mt-2" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Section
// ─────────────────────────────────────────────────────────────
export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-[#f8fafc] pt-24 pb-48 overflow-hidden font-sans">
      {/* Header Copy */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-black mb-8 border border-green-200 shadow-sm">
          <Store size={14} /> MULTI-VENDOR ENTERPRISE
        </div>
        <h1  className="text-5xl md:text-[5rem] font-bold  text-slate-900 leading-[0.9] tracking-tighter mb-10">
          Scale your shop with
          <br />
          <span className="text-green-600 mt-5">StockSense</span>
        </h1>
        <p className="text-slate-500 text-xl max-w-2xl mx-auto font-medium mb-12 leading-relaxed">
          The all-in-one workstation for supermarket giants and independent
          vendors. Scan items, manage multi-location inventory, and print
          receipts instantly.
        </p>
        {/* <div className="flex flex-wrap justify-center gap-4">
          <Link to={ROUTES.REGISTER}>
            <button className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-black text-lg flex items-center gap-3 hover:bg-slate-800 transition-all ">
              Join as Vendor <ChevronRight size={20} />
            </button>
          </Link>
          <button className="bg-white text-slate-900 border-2 border-slate-100 px-10 py-3 rounded-2xl font-black text-lg hover:bg-gray-50 transition-all">
            Book Demo
          </button>
        </div> */}
      </div>

      {/* The Hardware Desktop Setup */}
      <div className="relative max-w-300 mx-auto px-4 mt-20">
        {/* Shared Surface Line (Desktop) */}
        <div className="absolute bottom-0.5 left-0 w-full h-0.5 bg-slate-200/60" />

        <div className="flex items-end justify-between gap-4">
          {/* Printer - Left Aligned */}
          <div className="pb-1">
            <ThermalPrinter />
            <p className="text-[10px] text-slate-400 font-black mt-16 text-center uppercase tracking-[0.2em]">
              Receipt Unit
            </p>
          </div>

          {/* Monitor & Keyboard - Center */}
          <div className="flex flex-col items-center">
            <ProfessionalMonitor>
              {/* Internal POS Interface */}
              <div className="flex flex-col h-full bg-white">
                <div className="flex items-center justify-between px-8 py-5 bg-slate-50 border-b border-slate-100">
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-lg">
                      <Store size={12} /> REGISTER #04
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-[10px] font-black rounded-lg border border-green-100">
                      ONLINE SYNC
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-900">
                        Sarah Watkins
                      </p>
                      <p className="text-[9px] text-slate-400">
                        Senior Operator
                      </p>
                    </div>
                    <div className="w-9 h-9 bg-slate-200 rounded-full border-2 border-white shadow-sm" />
                  </div>
                </div>

                <div className="flex-1 flex">
                  {/* Left Panel: Items List */}
                  <div className="flex-1 p-8 border-r border-slate-50 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-black text-slate-900">
                        Current Session
                      </h3>
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <LayoutGrid size={18} className="text-slate-400" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { n: "Organic Oat Milk 1L", p: "£4.50", s: "SS-482" },
                        { n: "Free Range Eggs x12", p: "£3.20", s: "SS-491" },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
                        >
                          <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-white rounded-lg border border-slate-100" />
                            <div>
                              <p className="text-xs font-black text-slate-800">
                                {item.n}
                              </p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                {item.s}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-black text-slate-900">
                            {item.p}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Panel: Summary */}
                  <div className="w-72 bg-slate-50/50 p-8 flex flex-col">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                        Subtotal
                      </p>
                      <p className="text-3xl font-[1000] text-slate-900 tracking-tighter">
                        £7.70
                      </p>
                    </div>
                    <div className="space-y-3">
                      <button className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-600/20">
                        <CheckCircle2 size={18} /> COMPLETE
                      </button>
                      <button className="w-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
                        <Printer size={18} /> RECEIPT
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </ProfessionalMonitor>
            <div className="mt-8">
              <DesktopKeyboard />
            </div>
          </div>

          {/* Scanner - Right Aligned */}
          <div className="pb-1">
            <HandheldScanner />
            <p className="text-[10px] text-slate-400 font-black mt-6 text-center uppercase tracking-[0.2em]">
              Laser Scanner
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes print {
          0% { height: 0px; opacity: 0; transform: translateX(-50%) translateY(-20px); }
          15% { height: 90px; opacity: 1; transform: translateX(-50%) translateY(0); }
          85% { height: 90px; opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { height: 90px; opacity: 0; transform: translateX(-50%) translateY(30px); }
        }
      `}</style>
    </section>
  );
}
