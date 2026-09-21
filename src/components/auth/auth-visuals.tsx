"use client";

/** Live illustrations for the dark brand panel of the auth pages. Sample data, frozen when motion is reduced. */
import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, CheckCheck, Flame, MousePointerClick, ShieldOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTicker } from "@/components/landing/feature-visuals";

const spring = { type: "spring" as const, stiffness: 360, damping: 28 };

/* ------------------------------------------------- sign-in: activity feed */

const FEED: { icon: LucideIcon; tone: string; title: string; sub: string }[] = [
  { icon: CheckCheck, tone: "bg-emerald-500/15 text-emerald-300", title: "Delivered", sub: "1,198 of 1,240 messages" },
  { icon: MousePointerClick, tone: "bg-blue-500/15 text-blue-300", title: "Link clicked", sub: "ID #646842 · just now" },
  { icon: ShieldOff, tone: "bg-slate-500/20 text-slate-300", title: "Bot click ignored", sub: "Preview crawler" },
  { icon: Flame, tone: "bg-amber-500/15 text-amber-300", title: "Hot lead", sub: "Clicked in 3 campaigns" },
];

export function ActivityFeed() {
  const { ref, n } = useTicker(2200, 3);
  const items = Array.from({ length: 3 }, (_, k) => {
    const id = n - k;
    return id >= 0 ? { id, ...FEED[id % FEED.length] } : null;
  }).filter(Boolean) as ({ id: number } & (typeof FEED)[number])[];

  return (
    <div ref={ref} aria-hidden="true">
      <div className="relative h-[232px] space-y-2.5 overflow-hidden [mask-image:linear-gradient(to_bottom,#000_70%,transparent)]">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((it, idx) => {
            const Icon = it.icon;
            return (
              <motion.div
                key={it.id}
                layout
                initial={{ opacity: 0, y: -24, scale: 0.96 }}
                animate={{ opacity: 1 - idx * 0.25, y: 0, scale: 1 - idx * 0.02 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={spring}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur"
              >
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", it.tone)}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-semibold text-white">{it.title}</span>
                  <span className="text-xs text-slate-400">{it.sub}</span>
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <p className="mt-3 text-[11px] text-slate-500">Sample activity</p>
    </div>
  );
}

/* --------------------------------------------- sign-up: setup checklist */

const STEPS = [
  { title: "Create your workspace", sub: "Takes about a minute" },
  { title: "Verify your phone number", sub: "You get 50 free credits" },
  { title: "Send your first tracked campaign", sub: "See who clicks, live" },
];

export function SetupChecklist() {
  const reduce = useReducedMotion();
  const { ref, n } = useTicker(1300, 8);
  const done = Math.min(3, n % 7); // 0..3 ticks, then a pause, then restarts

  return (
    <div ref={ref} aria-hidden="true" className="space-y-3">
      <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
        <div className="relative h-[72px] w-[72px] shrink-0">
          <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
            <defs>
              <linearGradient id="authRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#818cf8" />
                <stop offset="1" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="34" fill="none" strokeWidth="7" stroke="rgba(255,255,255,0.12)" />
            <motion.circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="url(#authRing)"
              strokeWidth="7"
              strokeLinecap="round"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.6, ease: "easeOut" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-2xl font-extrabold text-white">50</span>
        </div>
        <div className="leading-snug">
          <p className="text-sm font-semibold text-white">Free credits to start</p>
          <p className="text-xs text-slate-400">1 credit = 1 SMS. No credit card needed.</p>
        </div>
      </div>

      <ol className="space-y-2">
        {STEPS.map((s, i) => {
          const complete = done > i;
          const current = done === i;
          return (
            <li
              key={s.title}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors duration-500",
                complete ? "border-emerald-400/30 bg-emerald-500/10" : current ? "border-indigo-400/40 bg-indigo-500/10" : "border-white/10 bg-white/[0.03]"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-500",
                  complete ? "bg-emerald-500 text-white" : current ? "bg-indigo-500 text-white" : "bg-white/10 text-slate-400"
                )}
              >
                {complete ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="leading-tight">
                <span className={cn("block text-sm font-semibold transition-colors", complete || current ? "text-white" : "text-slate-400")}>{s.title}</span>
                <span className="text-xs text-slate-500">{s.sub}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
