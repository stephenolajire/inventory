// src/pages/landing/TestimonialsSection.tsx

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  MapPin,
  TrendingUp,
  Package,
  Clock,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Intersection observer hook
// ─────────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Testimonial {
  id: number;
  name: string;
  role: string;
  business: string;
  location: string;
  avatar: string;
  avatarColor: string;
  rating: number;
  quote: string;
  highlight: string;
  stat: string;
  statLabel: string;
  statIcon: React.ReactNode;
  plan: string;
  planColor: string;
}

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Adaeze Okonkwo",
    role: "Owner",
    business: "Ade's Supermart",
    location: "Surulere, Lagos",
    avatar: "AO",
    avatarColor: "bg-green-500",
    rating: 5,
    quote:
      "Before StockSense I was writing everything in a notebook and losing track of stock every single week. Now I scan and it is done. My cashier learnt it in one afternoon — no training needed at all.",
    highlight: "My cashier learnt it in one afternoon",
    stat: "+34%",
    statLabel: "Revenue increase",
    statIcon: <TrendingUp size={14} />,
    plan: "Pro",
    planColor:
      "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
  },
  {
    id: 2,
    name: "Emeka Nwachukwu",
    role: "Co-founder",
    business: "NwaChi Stores",
    location: "Enugu",
    avatar: "EN",
    avatarColor: "bg-blue-500",
    rating: 5,
    quote:
      "The analytics dashboard is what sold me. I used to guess which products were selling — now I have real numbers. Found out my rush hour is 5–7pm so I made sure I am always staffed then. Sales went up immediately.",
    highlight: "Found out my rush hour is 5–7pm",
    stat: "3×",
    statLabel: "Faster checkout",
    statIcon: <Clock size={14} />,
    plan: "Enterprise",
    planColor:
      "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400",
  },
  {
    id: 3,
    name: "Funmi Badmus",
    role: "Proprietor",
    business: "Funmi's Provisions",
    location: "Ibadan, Oyo",
    avatar: "FB",
    avatarColor: "bg-rose-500",
    rating: 5,
    quote:
      "I have tried two other apps before and both of them were too complicated. StockSense just works. I set it up on a Saturday and was using it at the counter on Monday morning.",
    highlight: "Set it up on Saturday, selling Monday",
    stat: "847",
    statLabel: "Products tracked",
    statIcon: <Package size={14} />,
    plan: "Pro",
    planColor:
      "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
  },
  {
    id: 4,
    name: "Chukwudi Eze",
    role: "Manager",
    business: "Eze Brothers Stores",
    location: "Onitsha, Anambra",
    avatar: "CE",
    avatarColor: "bg-indigo-500",
    rating: 5,
    quote:
      "We have three branches and managing stock across all of them was a nightmare. StockSense gives each branch its own account and I can see everything from my phone. Low stock alerts have saved us from running out of key products so many times.",
    highlight: "Three branches, one dashboard",
    stat: "£2.1M",
    statLabel: "Monthly revenue tracked",
    statIcon: <TrendingUp size={14} />,
    plan: "Enterprise",
    planColor:
      "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400",
  },
  {
    id: 5,
    name: "Ngozi Ikenna",
    role: "Owner",
    business: "Ngozi Mini Mart",
    location: "Port Harcourt, Rivers",
    avatar: "NI",
    avatarColor: "bg-teal-500",
    rating: 5,
    quote:
      "The PDF reports are exactly what I needed. My accountant used to ask me for sales figures every month and I had nothing to give. Now I just download the monthly report and send it. Clean, professional, no stress.",
    highlight: "Just download and send to my accountant",
    stat: "12",
    statLabel: "Reports generated",
    statIcon: <TrendingUp size={14} />,
    plan: "Pro",
    planColor:
      "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
  },
  {
    id: 6,
    name: "Taiwo Adesanya",
    role: "Director",
    business: "Adesanya Wholesale",
    location: "Mushin, Lagos",
    avatar: "TA",
    avatarColor: "bg-orange-500",
    rating: 5,
    quote:
      "We do a very high volume at the counter — sometimes 60 to 80 customers in a single afternoon. StockSense handles it without breaking a sweat. The barcode scanning is incredibly fast.",
    highlight: "80 customers, zero slowdowns",
    stat: "0.3s",
    statLabel: "Avg scan time",
    statIcon: <Clock size={14} />,
    plan: "Basic",
    planColor:
      "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400",
  },
];

const PLATFORM_STATS = [
  { value: "2,400+", label: "Active vendors", icon: <TrendingUp size={18} /> },
  { value: "4.9/5", label: "Average rating", icon: <Star size={18} /> },
  { value: "98%", label: "Would recommend", icon: <TrendingUp size={18} /> },
  { value: "< 1hr", label: "Avg setup time", icon: <Clock size={18} /> },
];

// ─────────────────────────────────────────────────────────────
// Star rating
// ─────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={
            i < rating
              ? "text-amber-400 fill-amber-400"
              : "text-border fill-border"
          }
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Featured testimonial card — large
// ─────────────────────────────────────────────────────────────

interface FeaturedCardProps {
  testimonial: Testimonial;
  visible: boolean;
}

function FeaturedCard({ testimonial, visible }: FeaturedCardProps) {
  return (
    <div
      className={`
        transition-all duration-500
        ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
      `}
    >
      <div className="bg-bg-surface rounded-3xl border border-border shadow-xl overflow-hidden">
        <div className="grid lg:grid-cols-5">
          {/* Left — quote */}
          <div className="lg:col-span-3 p-8 lg:p-10">
            {/* Quote icon */}
            <div className="w-10 h-10 rounded-xl bg-primary-subtle flex items-center justify-center mb-6">
              <Quote size={18} className="text-primary" />
            </div>

            {/* Plan badge */}
            <span
              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold mb-4 ${testimonial.planColor}`}
            >
              {testimonial.plan} plan
            </span>

            {/* Quote */}
            <blockquote className="text-lg lg:text-xl text-text-primary font-medium leading-relaxed mb-6">
              "
              {testimonial.quote
                .split(testimonial.highlight)
                .map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="text-primary font-bold">
                        {testimonial.highlight}
                      </span>
                    )}
                  </span>
                ))}
              "
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-4">
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  text-white font-bold text-sm shrink-0
                  ${testimonial.avatarColor}
                `}
              >
                {testimonial.avatar}
              </div>
              <div>
                <div className="font-semibold text-text-primary">
                  {testimonial.name}
                </div>
                <div className="text-sm text-text-muted">
                  {testimonial.role}, {testimonial.business}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={11} className="text-text-muted" />
                  <span className="text-xs text-text-muted">
                    {testimonial.location}
                  </span>
                </div>
              </div>
              <div className="ml-auto">
                <StarRating rating={testimonial.rating} />
              </div>
            </div>
          </div>

          {/* Right — stat panel */}
          <div className="lg:col-span-2 bg-bg-inverse flex flex-col items-center justify-center p-8 lg:p-10 gap-6">
            {/* Big stat */}
            <div className="text-center">
              <div className="font-heading font-extrabold text-4xl lg:text-5xl text-white mb-1">
                {testimonial.stat}
              </div>
              <div className="flex items-center justify-center gap-1.5 text-green-400 text-sm font-medium">
                {testimonial.statIcon}
                {testimonial.statLabel}
              </div>
            </div>

            <div className="w-16 h-px bg-white/10" />

            {/* Mini quote */}
            <p className="text-center text-sm text-green-200 leading-relaxed italic">
              "{testimonial.highlight}"
            </p>

            {/* Business info */}
            <div className="text-center">
              <div className="text-white font-semibold text-sm">
                {testimonial.business}
              </div>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <MapPin size={11} className="text-green-400" />
                <span className="text-green-400 text-xs">
                  {testimonial.location}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Small testimonial card — grid
// ─────────────────────────────────────────────────────────────

interface SmallCardProps {
  testimonial: Testimonial;
  index: number;
  inView: boolean;
}

function SmallCard({ testimonial, index, inView }: SmallCardProps) {
  return (
    <div
      className={`
        bg-bg-surface rounded-2xl border border-border shadow-sm
        p-6 flex flex-col gap-4
        hover:border-primary-muted hover:shadow-md
        transition-all duration-300
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
      `}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              text-white font-bold text-xs shrink-0
              ${testimonial.avatarColor}
            `}
          >
            {testimonial.avatar}
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary">
              {testimonial.name}
            </div>
            <div className="text-xs text-text-muted">
              {testimonial.business}
            </div>
          </div>
        </div>
        <StarRating rating={testimonial.rating} />
      </div>

      {/* Quote */}
      <p className="text-sm text-text-secondary leading-relaxed flex-1">
        "
        {testimonial.quote.length > 140
          ? testimonial.quote.slice(0, 140) + "..."
          : testimonial.quote}
        "
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-1">
          <MapPin size={11} className="text-text-muted" />
          <span className="text-xs text-text-muted">
            {testimonial.location}
          </span>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${testimonial.planColor}`}
        >
          {testimonial.plan}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Platform stats strip
// ─────────────────────────────────────────────────────────────

function PlatformStats() {
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref}
      className={`
        grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16
        transition-all duration-700
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
      `}
    >
      {PLATFORM_STATS.map((stat, i) => (
        <div
          key={stat.label}
          className="
            bg-bg-surface rounded-2xl border border-border
            p-5 text-center
            hover:border-primary-muted hover:shadow-md
            transition-all duration-200
          "
          style={{ transitionDelay: `${i * 80}ms` }}
        >
          <div className="flex items-center justify-center gap-1.5 text-primary mb-2">
            {stat.icon}
          </div>
          <div className="font-heading font-extrabold text-2xl text-text-primary mb-0.5">
            {stat.value}
          </div>
          <div className="text-xs text-text-muted font-medium">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────────────────────

function SectionHeader() {
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref}
      className={`
        text-center max-w-2xl mx-auto mb-12
        transition-all duration-700
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
      `}
    >
      {/* Eyebrow */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-subtle border border-primary-muted mb-5">
        <Star size={11} className="text-primary fill-primary" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
          Vendor stories
        </span>
      </div>

      <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-text-primary tracking-tight mb-5">
        Vendors across Nigeria{" "}
        <span className="text-primary">trust StockSense</span>
      </h2>

      <p className="text-lg text-text-secondary leading-relaxed">
        From small provisions stores in Ibadan to multi-branch operations in
        Lagos — here is what real vendors say after switching to StockSense.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Carousel controls
// ─────────────────────────────────────────────────────────────

interface CarouselControlsProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onChange: (i: number) => void;
}

function CarouselControls({
  current,
  total,
  onPrev,
  onNext,
  onChange,
}: CarouselControlsProps) {
  return (
    <div className="flex items-center justify-between mt-6">
      {/* Dot indicators */}
      <div className="flex items-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            aria-label={`Go to testimonial ${i + 1}`}
            className={`
              rounded-full transition-all duration-300
              ${
                i === current
                  ? "w-6 h-2 bg-primary"
                  : "w-2 h-2 bg-border hover:bg-border-strong"
              }
            `}
          />
        ))}
      </div>

      {/* Arrow buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          aria-label="Previous testimonial"
          className="
            w-9 h-9 rounded-xl border border-border
            flex items-center justify-center
            text-text-muted hover:text-text-primary
            hover:bg-bg-subtle hover:border-border-strong
            transition-all duration-150
          "
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={onNext}
          aria-label="Next testimonial"
          className="
            w-9 h-9 rounded-xl border border-border
            flex items-center justify-center
            text-text-muted hover:text-text-primary
            hover:bg-bg-subtle hover:border-border-strong
            transition-all duration-150
          "
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Marquee row — infinite scroll strip
// ─────────────────────────────────────────────────────────────

function MarqueeStrip() {
  const items = [
    "Lagos",
    "Abuja",
    "Enugu",
    "Ibadan",
    "Port Harcourt",
    "Kano",
    "Onitsha",
    "Kaduna",
    "Benin City",
    "Aba",
    "Mushin",
    "Surulere",
    "Ikeja",
    "Lekki",
    "Owerri",
  ];

  return (
    <div className="relative overflow-hidden py-4 border-y border-border bg-bg-subtle">
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-linear-to-r from-bg-subtle to-transparent z-10 pointer-events-none" />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-linear-to-l from-bg-subtle to-transparent z-10 pointer-events-none" />

      {/* Scrolling content */}
      <div
        className="flex items-center gap-8 animate-[marquee_30s_linear_infinite]"
        style={{ width: "max-content" }}
      >
        {[...items, ...items].map((city, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <MapPin size={12} className="text-primary" />
            <span className="text-sm font-medium text-text-muted whitespace-nowrap">
              {city}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main section
// ─────────────────────────────────────────────────────────────

export default function TestimonialsSection() {
  const [featured, setFeatured] = useState(0);
  const [visible, setVisible] = useState(true);
  const { ref: gridRef, inView: gridInView } = useInView(0.1);

  const goTo = useCallback((index: number) => {
    setVisible(false);
    setTimeout(() => {
      setFeatured(index);
      setVisible(true);
    }, 250);
  }, []);

  const goPrev = useCallback(() => {
    goTo((featured - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, [featured, goTo]);

  const goNext = useCallback(() => {
    goTo((featured + 1) % TESTIMONIALS.length);
  }, [featured, goTo]);

  // Auto-advance every 6 seconds
  useEffect(() => {
    const t = setInterval(goNext, 6000);
    return () => clearInterval(t);
  }, [goNext]);

  // Grid testimonials — all except the featured one
  const gridTestimonials = TESTIMONIALS.filter((_, i) => i !== featured);

  return (
    <section
      id="testimonials"
      className=" bg-bg-base relative overflow-hidden"
    >
      {/* Background decoration */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 rounded-full opacity-[0.04] pointer-events-none"
        style={{
          background: "radial-gradient(circle, #0F6E56, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <SectionHeader />

        {/* Platform stats */}
        <PlatformStats />

        {/* Featured testimonial carousel */}
        <div>
          <FeaturedCard
            testimonial={TESTIMONIALS[featured]}
            visible={visible}
          />
          <CarouselControls
            current={featured}
            total={TESTIMONIALS.length}
            onPrev={goPrev}
            onNext={goNext}
            onChange={goTo}
          />
        </div>

        {/* Divider */}
        <div className="my-16 flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted font-medium uppercase tracking-widest px-2">
            More vendor stories
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Small card grid */}
        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {gridTestimonials.map((t, i) => (
            <SmallCard
              key={t.id}
              testimonial={t}
              index={i}
              inView={gridInView}
            />
          ))}
        </div>
      </div>

      {/* City marquee strip */}
      <div className="mt-20">
        <p className="text-center text-xs text-text-muted uppercase tracking-widest mb-4 font-medium">
          Trusted by vendors in
        </p>
        <MarqueeStrip />
      </div>
    </section>
  );
}
