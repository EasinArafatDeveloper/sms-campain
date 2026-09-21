"use client";

/**
 * Small animated building blocks in the style of 21st.dev / Magic UI.
 * All of them respect `prefers-reduced-motion`.
 */
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionTemplate,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ Reveal */

/** Fades + lifts its children into view once, with an optional stagger delay. */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Comp>
  );
}

/* ---------------------------------------------------- Animated gradient text */

export function GradientText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-500 bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-gradient-x dark:from-indigo-300 dark:via-sky-300 dark:to-cyan-300",
        className
      )}
    >
      {children}
    </span>
  );
}

/* ---------------------------------------------------------- Shimmer button */

export function ShimmerButton({
  href,
  children,
  className,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "ghost";
}) {
  const primary = variant === "primary";
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl px-6 text-sm font-semibold transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.97] dark:focus-visible:ring-offset-slate-950",
        primary
          ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 dark:bg-white dark:text-slate-950 dark:shadow-white/10"
          : "border border-slate-300 bg-white/70 text-slate-800 backdrop-blur hover:border-slate-400 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10",
        className
      )}
    >
      {primary && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent motion-safe:animate-shimmer dark:via-slate-900/15"
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </Link>
  );
}

/* ---------------------------------------------------------- Spotlight card */

/** Card with a soft light that follows the cursor. */
export function SpotlightCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const background = useMotionTemplate`radial-gradient(320px circle at ${x}px ${y}px, rgba(99,102,241,0.16), transparent 70%)`;

  return (
    <div
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left);
        y.set(e.clientY - rect.top);
      }}
      onMouseLeave={() => {
        x.set(-200);
        y.set(-200);
      }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur transition-colors hover:border-indigo-300/70 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-indigo-400/40",
        className
      )}
    >
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background }} />
      <div className="relative">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------- Border beam */

/** A light that travels around the border of its (relative, rounded) parent. */
export function BorderBeam({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 rounded-[inherit] [mask:linear-gradient(#000,#000)_content-box,linear-gradient(#000,#000)] [mask-composite:exclude] p-px", className)}
    >
      <span className="absolute inset-[-100%] motion-safe:animate-spin-slow bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(99,102,241,0.9)_330deg,rgba(34,211,238,0.9)_360deg)]" />
    </span>
  );
}

/* ------------------------------------------------------------ Number ticker */

export function NumberTicker({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(display, value, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, inView, reduce]);

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(display);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ Marquee */

export function Marquee({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("group relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]", className)}>
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden={i === 1}
          className="flex min-w-full shrink-0 items-center justify-around gap-8 pr-8 motion-safe:animate-marquee motion-reduce:flex-wrap group-hover:[animation-play-state:paused]"
        >
          {children}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- Backdrop */

/** Fine grid + aurora glows behind the hero. Purely decorative. */
export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(100,116,139,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.12)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)] dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.09)_1px,transparent_1px)]" />
      <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-500/25 via-blue-500/20 to-cyan-400/20 blur-[120px] motion-safe:animate-aurora dark:from-indigo-500/30 dark:via-blue-600/20 dark:to-cyan-500/15" />
      <div className="absolute right-[-12%] top-[38%] h-[420px] w-[520px] rounded-full bg-fuchsia-400/10 blur-[130px] dark:bg-fuchsia-500/10" />
    </div>
  );
}
