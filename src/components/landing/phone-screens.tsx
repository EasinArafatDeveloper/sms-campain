"use client";

/**
 * The phone frame and the four "app screens" shown inside it by the scroll hero.
 * Each screen is driven by a MotionValue `t` (0 → 1 = progress through that screen), so everything
 * inside (typing, counters, bars) plays forward and backward as the visitor scrolls.
 * All numbers are sample data.
 */
import React, { useState } from "react";
import { motion, MotionValue, useMotionValueEvent, useTransform } from "framer-motion";
import { BarChart3, Flame, ListOrdered, Send, Users, CheckCheck, RefreshCw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const useSeg = (t: MotionValue<number>, a: number, b: number) => useTransform(t, [a, b], [0, 1], { clamp: true });

function Counter({ value, decimals = 0, suffix = "" }: { value: MotionValue<number>; decimals?: number; suffix?: string }) {
  const text = useTransform(value, (v) =>
    v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix
  );
  return <motion.span>{text}</motion.span>;
}

/* ------------------------------------------------------------------ Frame */

const TABS = [Send, ListOrdered, BarChart3, Users];

export function PhoneFrame({
  children,
  active = 0,
  className,
}: {
  children: React.ReactNode;
  active?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[9/19.3] rounded-[46px] bg-gradient-to-b from-slate-800 to-slate-950 p-[9px] shadow-[0_40px_80px_-24px_rgba(79,70,229,0.4)] ring-1 ring-slate-900/10 dark:from-slate-600 dark:to-slate-800 dark:shadow-[0_40px_80px_-20px_rgba(79,70,229,0.5)] dark:ring-white/20",
        className
      )}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[37px] bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {/* status bar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-11 items-center justify-between px-6 text-[10px] font-semibold text-slate-800 dark:text-slate-100">
          <span>9:41</span>
          <span className="absolute left-1/2 top-2 h-[22px] w-[78px] -translate-x-1/2 rounded-full bg-slate-950" />
          <span className="tracking-tight">5G ▮▮▮</span>
        </div>

        {children}

        {/* tab bar */}
        <div className="absolute inset-x-3 bottom-3 z-20 flex items-center justify-around rounded-[22px] border border-slate-200 bg-white/90 px-2 py-2 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/90">
          {TABS.map((Icon, i) => (
            <span
              key={i}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-2xl transition-colors duration-300",
                i === active ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 dark:text-slate-500"
              )}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col gap-3 bg-slate-50 px-4 dark:bg-slate-950 pb-[74px] pt-[52px]">
      <div>
        <p className="font-display text-[19px] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">{title}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- Screen 1 */

const MESSAGE = "Eid offer is live! Get 20% off your next order today:";

export function ComposeScreen({ t }: { t: MotionValue<number> }) {
  const chars = (v: number) => Math.round(clamp01((v - 0.05) / 0.5) * MESSAGE.length);
  const [n, setN] = useState(() => chars(t.get()));
  useMotionValueEvent(t, "change", (v) => {
    const k = chars(v);
    setN((prev) => (prev === k ? prev : k));
  });

  const linkOpacity = useSeg(t, 0.58, 0.68);
  const linkY = useTransform(linkOpacity, [0, 1], [8, 0]);
  const btnScale = useTransform(t, [0.8, 0.88, 0.96], [1, 1.05, 1]);
  const done = n >= MESSAGE.length;

  return (
    <ScreenShell title="New campaign" subtitle="Write once, every contact gets their own link">
      <div className="flex gap-2 text-[10.5px] font-semibold">
        <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">Sender 8809612781020</span>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">1,240 contacts</span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Message</p>
        <p className="min-h-[74px] text-[12.5px] leading-snug text-slate-800 dark:text-slate-100">
          {MESSAGE.slice(0, n)}
          {!done && <span className="ml-px inline-block h-3.5 w-px translate-y-0.5 bg-indigo-600 motion-safe:animate-pulse" />}
          <motion.span style={{ opacity: linkOpacity, y: linkY }} className="mt-1.5 flex w-fit items-center rounded-lg bg-blue-50 px-2 py-1 font-mono text-[11px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
            {"{TRACKABLE_LINK}"}
          </motion.span>
        </p>
        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10.5px] text-slate-500 dark:border-white/10 dark:text-slate-400">
          <span>{done ? MESSAGE.length + 22 : n} / 160 characters</span>
          <span className="font-semibold text-emerald-600">1 SMS</span>
        </div>
      </div>

      <motion.div style={{ scale: btnScale }} className="mt-auto flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-[13px] font-bold text-white shadow-lg shadow-indigo-600/30">
        <Send className="h-4 w-4" aria-hidden="true" />
        Send to 1,240 contacts
      </motion.div>
    </ScreenShell>
  );
}

/* ---------------------------------------------------------------- Screen 2 */

export function DeliveryScreen({ t }: { t: MotionValue<number> }) {
  const sent = useTransform(t, [0.05, 0.5], [0, 1240], { clamp: true });
  const delivered = useTransform(t, [0.1, 0.75], [0, 1198], { clamp: true });
  const failed = useTransform(t, [0.3, 0.8], [0, 12], { clamp: true });
  const sentBar = useSeg(t, 0.05, 0.5);
  const delBar = useTransform(t, [0.1, 0.75], [0, 0.966], { clamp: true });
  const failBar = useTransform(t, [0.3, 0.8], [0, 0.01], { clamp: true });
  const retry = useSeg(t, 0.8, 0.9);

  const Row = ({ label, value, bar, color }: { label: string; value: MotionValue<number>; bar: MotionValue<number>; color: string }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</span>
        <span className="font-display text-[19px] font-extrabold tabular-nums text-slate-900 dark:text-white">
          <Counter value={value} />
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
        <motion.div style={{ scaleX: bar }} className={cn("h-full origin-left rounded-full", color)} />
      </div>
    </div>
  );

  return (
    <ScreenShell title="Delivery queue" subtitle="Live status of every message">
      <Row label="Sent" value={sent} bar={sentBar} color="bg-blue-500" />
      <Row label="Delivered" value={delivered} bar={delBar} color="bg-emerald-500" />
      <Row label="Failed" value={failed} bar={failBar} color="bg-rose-500" />
      <motion.div style={{ opacity: retry }} className="mt-auto flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2.5 text-[11.5px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        12 failed sends are retrying automatically
      </motion.div>
    </ScreenShell>
  );
}

/* ---------------------------------------------------------------- Screen 3 */

const BARS = [34, 48, 41, 72, 96, 63, 82];

export function ClicksScreen({ t }: { t: MotionValue<number> }) {
  const clicks = useTransform(t, [0.05, 0.6], [0, 186], { clamp: true });
  const ctr = useTransform(t, [0.05, 0.6], [0, 15], { clamp: true });
  const bots = useTransform(t, [0.4, 0.85], [0, 34], { clamp: true });

  return (
    <ScreenShell title="Click analytics" subtitle="Last 7 days">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Clicks</p>
          <p className="font-display text-[22px] font-extrabold tabular-nums text-slate-900 dark:text-white">
            <Counter value={clicks} />
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Click rate</p>
          <p className="font-display text-[22px] font-extrabold tabular-nums text-indigo-600 dark:text-indigo-300">
            <Counter value={ctr} decimals={1} suffix="%" />
          </p>
        </div>
      </div>

      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="flex h-full items-end gap-2">
          {BARS.map((h, i) => (
            <Bar key={i} t={t} h={h} i={i} />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2.5 text-[11.5px] font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        <span>
          <Counter value={bots} /> bot clicks filtered out
        </span>
      </div>
    </ScreenShell>
  );
}

function Bar({ t, h, i }: { t: MotionValue<number>; h: number; i: number }) {
  const grow = useSeg(t, 0.08 + i * 0.06, 0.4 + i * 0.06);
  return (
    <div className="flex h-full flex-1 items-end">
      <motion.div
        style={{ scaleY: grow, height: `${h}%` }}
        className="w-full origin-bottom rounded-t-lg bg-gradient-to-t from-indigo-600 to-cyan-400"
      />
    </div>
  );
}

/* ---------------------------------------------------------------- Screen 4 */

const LEADS = [
  { n: "8801•••••567", s: "3 campaigns · 7 clicks" },
  { n: "8801•••••204", s: "4 campaigns · 9 clicks" },
  { n: "8801•••••981", s: "3 campaigns · 5 clicks" },
  { n: "8801•••••430", s: "3 campaigns · 4 clicks" },
];

export function LeadsScreen({ t }: { t: MotionValue<number> }) {
  const total = useTransform(t, [0.05, 0.5], [0, 38], { clamp: true });
  const cta = useSeg(t, 0.7, 0.85);
  const ctaY = useTransform(cta, [0, 1], [14, 0]);

  return (
    <ScreenShell title="Active leads" subtitle="People who keep clicking">
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-3 text-white shadow-md shadow-amber-500/25">
        <div>
          <p className="text-[10.5px] font-semibold text-amber-50">Hot leads</p>
          <p className="font-display text-[24px] font-extrabold leading-none tabular-nums">
            <Counter value={total} />
          </p>
        </div>
        <Flame className="h-8 w-8 text-white/90" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        {LEADS.map((l, i) => (
          <LeadRow key={l.n} t={t} i={i} number={l.n} sub={l.s} />
        ))}
      </div>

      <motion.div style={{ opacity: cta, y: ctaY }} className="mt-auto flex h-11 items-center justify-center rounded-2xl bg-slate-900 text-[12.5px] font-bold text-white shadow-lg dark:bg-white dark:text-slate-900">
        Create retargeting campaign
      </motion.div>
    </ScreenShell>
  );
}

function LeadRow({ t, i, number, sub }: { t: MotionValue<number>; i: number; number: string; sub: string }) {
  const a = 0.08 + i * 0.07;
  const show = useSeg(t, a, a + 0.15);
  const x = useTransform(show, [0, 1], [24, 0]);
  return (
    <motion.div style={{ opacity: show, x }} className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">88</span>
      <div className="flex-1 leading-tight">
        <p className="font-mono text-[11.5px] font-semibold text-slate-900 dark:text-white">{number}</p>
        <p className="whitespace-nowrap text-[10px] text-slate-500 dark:text-slate-400">{sub}</p>
      </div>
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
        <Flame className="h-3 w-3" aria-hidden="true" />
        Hot
      </span>
    </motion.div>
  );
}

export const SCREENS = [ComposeScreen, DeliveryScreen, ClicksScreen, LeadsScreen];
