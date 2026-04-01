// src/pages/landing/TestimonialsSection.tsx
import { Star, MapPin } from "lucide-react";

const UK_TESTIMONIALS = [
  {
    id: 1,
    name: "Sarah Jenkins",
    business: "The Corner Pantry",
    location: "Manchester",
    quote:
      "StockSense turned our weekly inventory nightmare into a 10-minute task. The barcode scanning is absolutely flawless and saves us hours.",
  },
  {
    id: 2,
    name: "James Wilson",
    business: "Wilson & Sons Tech",
    location: "London",
    quote:
      "The analytics dashboard helped us identify our peak hours. We've seen a 20% increase in efficiency since we started tracking real-time data.",
  },
  {
    id: 3,
    name: "Amara Smith",
    business: "Brighton Blooms",
    location: "Brighton",
    quote:
      "I’ve tried many apps, but this is the only one my staff actually enjoys using. Setup was incredibly fast and the support is top-notch.",
  },
  {
    id: 4,
    name: "David O'Connor",
    business: "Eire Wholesale",
    location: "Birmingham",
    quote:
      "Managing three branches across the Midlands is now seamless. The low-stock alerts are life-savers for our high-volume inventory.",
  },
  {
    id: 5,
    name: "Elena Rossi",
    business: "Rossi's Deli",
    location: "Edinburgh",
    quote:
      "The PDF reporting is perfect for my accountant. Professional, clean, and saves me from drowning in monthly paperwork.",
  },
];

function TestimonialCard({ t }: { t: (typeof UK_TESTIMONIALS)[0] }) {
  return (
    <div className="w-[320px] sm:w-95 shrink-0 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between transition-all hover:border-indigo-200 hover:shadow-md">
      <div>
        <div className="flex gap-0.5 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
          ))}
        </div>

        {/* Fix: Added break-words and whitespace-normal to prevent overflow */}
        <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-8 whitespace-normal wrap-break-words hyphens-auto">
          "{t.quote}"
        </p>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
        <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
          {t.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div className="min-w-0">
          {" "}
          {/* min-w-0 allows the inner text to truncate if name is too long */}
          <div className="text-sm font-bold text-slate-900 truncate">
            {t.name}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <MapPin size={10} className="shrink-0" />
            <span className="truncate">
              {t.business}, {t.location}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-16 text-center">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          Trusted by UK Businesses
        </h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          From London boutiques to Manchester wholesalers.
        </p>
      </div>

      {/* Marquee Wrapper */}
      <div className="relative flex overflow-hidden py-4 group">
        <div className="flex gap-6 animate-marquee pause-on-hover">
          {/* Main Set */}
          {UK_TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.id} t={t} />
          ))}
          {/* Duplicate Set for Infinite Loop */}
          {UK_TESTIMONIALS.map((t) => (
            <TestimonialCard key={`dup-${t.id}`} t={t} />
          ))}
        </div>

        {/* Soft Edge Fades */}
        <div className="absolute inset-y-0 left-0 w-32 bg-linear-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-linear-to-l from-white to-transparent z-10 pointer-events-none" />
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 12px)); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 50s linear infinite;
        }
        .pause-on-hover:hover {
          animation-play-state: paused;
        }
      `,
        }}
      />
    </section>
  );
}
