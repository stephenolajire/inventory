// src/pages/landing/HowItWorksSection.tsx


import {
  UserPlus,
  Package,
  ShoppingCart,
  BarChart3,
  CheckCircle2,
  Zap,
  Clock,
  Scan,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Simplified Visuals (Light Mode Optimized)
// ─────────────────────────────────────────────────────────────

function RegisterVisual() {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 shadow-sm p-4 h-full">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
        <div className="w-5 h-5 rounded bg-green-600 flex items-center justify-center">
          <Zap size={10} className="text-white" fill="white" />
        </div>
        <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">
          Step 1: Sign Up
        </span>
      </div>
      <div className="space-y-2">
        <div className="h-6 bg-slate-50 border border-slate-100 rounded px-2 flex items-center text-[10px] text-slate-600">
          Ade's Supermart
        </div>
        <div className="h-6 bg-slate-50 border border-slate-100 rounded px-2 flex items-center text-[10px] text-slate-600">
          ade@supermart.ng
        </div>
        <div className="h-8 bg-green-600 rounded flex items-center justify-center text-[10px] font-bold text-white mt-2">
          Create Account
        </div>
      </div>
    </div>
  );
}

function AddProductsVisual() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-full">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
        <Package size={14} className="text-green-600" />
        <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">
          Step 2: Inventory
        </span>
      </div>
      <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 mb-2">
        <span className="text-[10px] font-medium text-slate-700">
          Peak Milk 400g
        </span>
        <span className="text-[10px] font-bold text-green-600">£2,800</span>
      </div>
      <div className="p-2 border-2 border-dashed border-slate-100 rounded flex flex-col items-center">
        <div className="flex gap-0.5 mb-1 h-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-0.5 bg-slate-300 h-full" />
          ))}
        </div>
        <span className="text-[8px] font-mono text-slate-400">
          BARCODE GENERATED
        </span>
      </div>
    </div>
  );
}

function SellingVisual() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full">
      <div className="bg-slate-900 px-3 py-2 flex items-center justify-between">
        <span className="text-[9px] font-bold text-white">POS SCREEN</span>
        <Scan size={10} className="text-green-400" />
      </div>
      <div className="p-3 space-y-2">
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-slate-600 font-medium">Milo Tin 200g</span>
          <span className="font-bold text-slate-900">£1,200</span>
        </div>
        <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase">
            Total
          </span>
          <span className="text-xs font-black text-slate-900">£1,200</span>
        </div>
        <div className="bg-green-100 text-green-700 text-[10px] font-bold p-1.5 rounded flex items-center justify-center gap-1">
          <CheckCircle2 size={10} /> Paid
        </div>
      </div>
    </div>
  );
}

function GrowthVisual() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-full">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
        <BarChart3 size={14} className="text-green-600" />
        <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">
          Step 4: Growth
        </span>
      </div>
      <div className="flex items-end gap-1 h-12 mb-2">
        {[40, 70, 45, 90, 60].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-green-500 rounded-t-sm"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between items-center text-[9px] font-bold">
        <span className="text-slate-400 uppercase tracking-wider">Revenue</span>
        <span className="text-green-600">+16%</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: 1,
    icon: <UserPlus size={20} />,
    title: "Register Business",
    desc: "Create an account and choose your plan. Approval is instant.",
    visual: <RegisterVisual />,
  },
  {
    number: 2,
    icon: <Package size={20} />,
    title: "Add Products",
    desc: "Upload items and get auto-generated barcodes for your shelves.",
    visual: <AddProductsVisual />,
  },
  {
    number: 3,
    icon: <ShoppingCart size={20} />,
    title: "Start Selling",
    desc: "Scan products and accept cash or transfers effortlessly.",
    visual: <SellingVisual />,
  },
  {
    number: 4,
    icon: <BarChart3 size={20} />,
    title: "Track Sales",
    desc: "Watch your daily revenue grow with live reports and charts.",
    visual: <GrowthVisual />,
  },
];

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-100 rounded-full mb-4">
            <Clock size={12} className="text-green-600" />
            <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">
              Speed to Market
            </span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">
            Ready to sell in <span className="text-green-600">30 minutes.</span>
          </h2>
          <p className="text-slate-500 max-w-md mx-auto font-medium">
            Four simple steps from sign-up to your first automated sale. No
            technical experience required.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col">
              {/* Step Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                  {step.number}
                </div>
                <div className="h-px flex-1 bg-slate-100" />
                <div className="text-green-600">{step.icon}</div>
              </div>

              {/* Text */}
              <h3 className="text-lg font-black text-slate-900 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                {step.desc}
              </p>

              {/* Simplified Visual Container */}
              <div className="mt-auto h-44 bg-slate-50 rounded-2xl p-4 border border-slate-100 relative group overflow-hidden">
                <div className="absolute inset-0 bg-green-600 opacity-0 group-hover:opacity-[0.02] transition-opacity" />
                {step.visual}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
