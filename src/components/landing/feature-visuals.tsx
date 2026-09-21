"use client";

/**
 * Small looping "mini scenes" shown inside the feature cards. They only run while on screen, use sample
 * data, and with `prefers-reduced-motion` they freeze on their finished frame.
 */
import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, CheckCheck, FileSpreadsheet, Flame, MousePointerClick, RefreshCw, Send, ShieldOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NumberTicker } from "./fx";

/** A counter that keeps ticking while its element is on screen. Frozen at `frozenAt` for reduced motion. */
export function useTicker(ms: number, frozenAt: number) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (reduce) {
      setN(frozenAt);
      return;
    }
    if (!inView) return;
    const id = setInterval(() => setN((v) => v + 1), ms);
    return () => clearInterval(id);
  }, [inView, reduce, ms, frozenAt]);

  return { ref, n };
}

const spring = { type: "spring" as const, stiffness: 380, damping: 28 };

/* ----------------------------------------------- 1. a unique link per person */

const ROWS = [
  ["8801•••••567", "646842"],
  ["8801•••••204", "974799"],
  ["8801•••••981", "318255"],
  ["8801•••••430", "702916"],
  ["8801•••••118", "560431"],
  ["8801•••••742", "884120"],
];

export function LinksVisual() {
  return (
    <div aria-hidden="true" className="grid gap-4 md:grid-cols-[1fr_1.15fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Your message</p>
        <p className="mt-2 text-sm leading-snug text-slate-800 dark:text-slate-100">
          Eid offer is live! Get 20% off today:{" "}
          <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
            {"{TRACKABLE_LINK}"}
          </span>
        </p>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            <NumberTicker value={112} /> / 160 characters
          </span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">1 SMS</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
          <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" />
        </div>
      </div>

      <div className="relative h-[176px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_16%,#000_84%,transparent)]">
        <div className="space-y-2 motion-safe:animate-marquee-y">
          {[...ROWS, ...ROWS].map(([num, id], i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-white/10 dark:bg-slate-900/70"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">88</span>
              <span className="font-mono text-slate-600 dark:text-slate-300">{num}</span>
              <ArrowRight className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="truncate font-mono font-semibold text-blue-600 dark:text-blue-400">go.brand.com/t/{id}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- 2. bot click filter */

const EVENTS = [
  { bot: true, label: "Message preview bot" },
  { bot: false, label: "Real tap on phone" },
  { bot: true, label: "Link prefetch" },
  { bot: false, label: "Real tap on phone" },
  { bot: true, label: "Crawler" },
  { bot: false, label: "Real tap on phone" },
];

export function BotVisual() {
  const { ref, n } = useTicker(1500, 5);
  const seen = Array.from({ length: n + 1 }, (_, i) => EVENTS[i % EVENTS.length]);
  const real = seen.filter((e) => !e.bot).length;
  const visible = seen.map((e, i) => ({ ...e, id: i })).slice(-3);

  return (
    <div ref={ref} aria-hidden="true" className="rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-slate-900/60">
      <div className="mb-2.5 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Real clicks</span>
        <span className="font-display text-lg font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">{real}</span>
      </div>
      <div className="relative h-[132px] space-y-2 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          {visible
            .slice()
            .reverse()
            .map((e) => (
              <motion.div
                key={e.id}
                layout
                initial={{ opacity: 0, y: -22, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={spring}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-2 text-xs",
                  e.bot
                    ? "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                    : "border-emerald-200 bg-emerald-50 text-slate-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-slate-100"
                )}
              >
                <span className={e.bot ? "line-through decoration-slate-400/70" : ""}>{e.label}</span>
                {e.bot ? (
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <ShieldOff className="h-3.5 w-3.5" /> Ignored
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300">
                    <Check className="h-3.5 w-3.5" /> Counted
                  </span>
                )}
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- 3. hot leads */

export function HotVisual() {
  const { ref, n } = useTicker(1000, 5);
  const s = n % 7; // 0..3 = campaigns clicked, 4..6 = hot
  const lit = Math.min(s, 3);
  const hot = s >= 4;

  return (
    <div ref={ref} aria-hidden="true" className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">88</span>
          <span className="font-mono text-xs text-slate-600 dark:text-slate-300">8801•••••567</span>
        </div>
        <div className="relative h-7 w-[86px]">
          <AnimatePresence>
            {hot && (
              <motion.span
                initial={{ opacity: 0, scale: 0.4, rotate: -12 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={spring}
                className="absolute inset-0 inline-flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-red-500 text-[11px] font-bold text-white shadow-lg shadow-amber-500/40"
              >
                <Flame className="h-3.5 w-3.5" /> Hot lead
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {["Campaign 1", "Campaign 2", "Campaign 3"].map((label, i) => {
          const on = i < lit;
          return (
            <motion.div
              key={label}
              animate={{ scale: on && i === lit - 1 ? [1, 1.08, 1] : 1 }}
              transition={{ duration: 0.4 }}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-[10.5px] font-semibold transition-colors duration-300",
                on
                  ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-300"
                  : "border-slate-200 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
              )}
            >
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-full", on ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-400 dark:bg-white/10")}>
                {on ? <MousePointerClick className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              </span>
              {label}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- 4. delivery */

export function DeliveryVisual() {
  const { ref, n } = useTicker(1100, 3);
  const s = n % 6; // 0 queued · 1 sent · 2 retry · 3 delivered · 4-5 hold
  const stage = s === 0 ? 0 : s <= 2 ? 1 : 2;
  const fill = stage === 0 ? 0 : stage === 1 ? 0.5 : 1;
  const nodes = ["Queued", "Sent", "Delivered"];

  return (
    <div ref={ref} aria-hidden="true" className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/60">
      <div className="relative mx-3 mt-2">
        <div className="absolute left-0 right-0 top-[15px] h-1 rounded-full bg-slate-200 dark:bg-white/10" />
        <motion.div
          className="absolute left-0 right-0 top-[15px] h-1 origin-left rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
          animate={{ scaleX: fill }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="relative flex justify-between">
          {nodes.map((label, i) => {
            const on = i <= stage;
            return (
              <div key={label} className="flex flex-col items-center gap-2">
                <motion.span
                  animate={{ scale: on && i === stage ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 0.45 }}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-300",
                    on
                      ? i === 2
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-sky-500 bg-sky-500 text-white"
                      : "border-slate-300 bg-white text-slate-300 dark:border-slate-600 dark:bg-slate-900"
                  )}
                >
                  {i === 2 && on ? <CheckCheck className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                </motion.span>
                <span className={cn("text-[11px] font-semibold", on ? "text-slate-800 dark:text-slate-100" : "text-slate-400 dark:text-slate-500")}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 h-8">
        <AnimatePresence mode="wait">
          {s === 2 ? (
            <motion.div
              key="retry"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
            >
              <RefreshCw className="h-3.5 w-3.5 motion-safe:animate-spin" /> 12 failed sends retrying
            </motion.div>
          ) : (
            <motion.p key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-[11px] text-slate-500 dark:text-slate-400">
              {stage === 2 ? "1,198 of 1,240 delivered" : stage === 1 ? "Sending to 1,240 contacts" : "Queued 1,240 messages"}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- 5. CSV */

const CSV_ROWS = [
  { raw: "017XXXXXXXX", clean: "88017XXXXXXXX", ok: true },
  { raw: "+880 18XXXXXXXX", clean: "88018XXXXXXXX", ok: true },
  { raw: "12345", clean: "Skipped", ok: false },
];

export function CsvVisual() {
  const { ref, n } = useTicker(900, 6);
  const s = n % 8; // rows convert one by one, then hold, then reset

  return (
    <div ref={ref} aria-hidden="true" className="rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-slate-900/60">
      <div className="mb-2.5 flex items-center gap-2 px-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        <FileSpreadsheet className="h-3.5 w-3.5 text-fuchsia-500" /> contacts.csv
        <span className="ml-auto font-normal text-slate-400">3 rows</span>
      </div>
      <div className="space-y-1.5">
        {CSV_ROWS.map((r, i) => {
          const done = s >= i + 2;
          return (
            <div key={r.raw} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[11px] dark:border-white/10 dark:bg-slate-900/70">
              <span className={cn("transition-colors", done ? "text-slate-400 line-through decoration-slate-300 dark:text-slate-600" : "text-slate-700 dark:text-slate-200")}>{r.raw}</span>
              <span className="relative h-4 w-[118px] text-right">
                <AnimatePresence>
                  {done && (
                    <motion.span
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={spring}
                      className={cn("absolute inset-0 inline-flex items-center justify-end gap-1 font-semibold", r.ok ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500")}
                    >
                      {r.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {r.clean}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ================================================================ How it works */

/* Step 1 – write the message: it types itself, then the link chip appears */

const TYPED = "Eid offer is live! Get 20% off today:";

export function ComposeVisual() {
  const { ref, n } = useTicker(70, TYPED.length + 4);
  const cycle = TYPED.length + 34; // typing, then a pause
  const chars = Math.min(TYPED.length, n % cycle);
  const done = chars >= TYPED.length;

  return (
    <div ref={ref} aria-hidden="true" className="rounded-2xl border border-slate-200 bg-white/80 p-3.5 dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex flex-wrap gap-1.5 text-[10.5px] font-semibold">
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">Sender ID</span>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">1,240 contacts</span>
      </div>
      <p className="mt-3 min-h-[64px] text-[13px] leading-snug text-slate-800 dark:text-slate-100">
        {TYPED.slice(0, chars)}
        {!done && <span className="ml-px inline-block h-3.5 w-px translate-y-0.5 bg-indigo-600 motion-safe:animate-pulse dark:bg-indigo-300" />}
        <AnimatePresence>
          {done && (
            <motion.span
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={spring}
              className="mt-1.5 flex w-fit rounded-lg bg-blue-50 px-2 py-1 font-mono text-[11px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
            >
              {"{TRACKABLE_LINK}"}
            </motion.span>
          )}
        </AnimatePresence>
      </p>
    </div>
  );
}

/* Step 2 – send: a progress bar fills and the counters climb */

export function SendVisual() {
  const { ref, n } = useTicker(260, 10);
  const p = Math.min(1, (n % 17) / 10);
  const sent = Math.round(1240 * p);
  const delivered = Math.round(1198 * Math.max(0, p - 0.1) / 0.9);

  return (
    <div ref={ref} aria-hidden="true" className="rounded-2xl border border-slate-200 bg-white/80 p-3.5 dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <Send className={cn("h-3.5 w-3.5", p < 1 && "text-indigo-500 motion-safe:animate-pulse")} /> {p < 1 ? "Sending…" : "Sent"}
        </span>
        <span className="font-display text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">{sent.toLocaleString("en-US")}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
        <motion.div
          className="h-full origin-left rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
          animate={{ scaleX: p }}
          transition={{ duration: 0.3, ease: "linear" }}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg bg-emerald-50 px-2.5 py-1.5 dark:bg-emerald-500/10">
          <p className="text-slate-500 dark:text-slate-400">Delivered</p>
          <p className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{delivered.toLocaleString("en-US")}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-white/5">
          <p className="text-slate-500 dark:text-slate-400">Unique links</p>
          <p className="font-semibold text-slate-700 dark:text-slate-200">Tracked</p>
        </div>
      </div>
    </div>
  );
}

/* Step 3 – results: bars grow, then a hot-lead badge pops */

const RESULT_BARS = [34, 48, 41, 72, 96, 63, 82];

export function ResultsVisual() {
  const { ref, n } = useTicker(320, 12);
  const step = n % 16;
  const shown = Math.min(7, step);
  const hot = step >= 9;
  const clicks = Math.round((186 * shown) / 7);

  return (
    <div ref={ref} aria-hidden="true" className="rounded-2xl border border-slate-200 bg-white/80 p-3.5 dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Clicks</p>
          <p className="font-display text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">{clicks}</p>
        </div>
        <div className="relative h-7 w-[92px]">
          <AnimatePresence>
            {hot && (
              <motion.span
                initial={{ opacity: 0, scale: 0.4, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={spring}
                className="absolute inset-0 inline-flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-red-500 text-[11px] font-bold text-white shadow-lg shadow-amber-500/40"
              >
                <Flame className="h-3.5 w-3.5" /> 38 hot leads
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="mt-3 flex h-[58px] items-end gap-1.5">
        {RESULT_BARS.map((h, i) => (
          <div key={i} className="flex h-full flex-1 items-end">
            <motion.div
              animate={{ scaleY: i < shown ? 1 : 0.05 }}
              transition={spring}
              style={{ height: `${h}%` }}
              className="w-full origin-bottom rounded-t-md bg-gradient-to-t from-indigo-600 to-cyan-400"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
