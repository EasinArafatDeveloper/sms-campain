"use client";

/**
 * Scroll-driven hero. The headline sits on top, a phone peeks in underneath; as the visitor scrolls the
 * section stays pinned, the phone rises to the centre and the app screens inside it change from step to
 * step while stickers fly in around it. Everything is driven by one scroll-progress value (0 → 1).
 * With `prefers-reduced-motion` the same content is shown as a plain, static layout.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  MotionValue,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  Check,
  FileSpreadsheet,
  Link2,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  MousePointerClick,
  Flame,
  Download,
  Repeat,
  CheckCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { GradientText, ShimmerButton } from "./fx";
import { PhoneFrame, SCREENS } from "./phone-screens";

/* ------------------------------------------------------------------- data */

const STEPS = [
  {
    title: "Write it once",
    body: "Drop {TRACKABLE_LINK} into your message and pick your contacts. Every recipient gets their own short link.",
  },
  {
    title: "Watch it go out",
    body: "Messages are queued, sent and tracked all the way to delivered. Failed sends retry automatically.",
  },
  {
    title: "See who clicked",
    body: "Link-preview bots and prefetch requests are filtered out, so a click means a real person.",
  },
  {
    title: "Follow up with hot leads",
    body: "People who keep clicking across campaigns are flagged, ready to export or retarget in one click.",
  },
];

/** Scroll-progress window of a step: it starts at 0.2 and each step owns 0.2. */
const stepStart = (i: number) => 0.2 + i * 0.2;
const stepEnd = (i: number) => stepStart(i) + 0.2;
/** [fade-in start, fully visible, start fading out, gone] */
const windowFor = (i: number): [number, number, number, number] => [
  i === 0 ? 0.15 : stepStart(i) - 0.03,
  stepStart(i) + 0.01,
  i === 3 ? 2 : stepEnd(i) - 0.04,
  i === 3 ? 3 : stepEnd(i),
];
const activeFromProgress = (v: number) => (v < 0.4 ? 0 : v < 0.6 ? 1 : v < 0.8 ? 2 : 3);

type StickerDef = {
  step: number;
  label: string;
  Icon: LucideIcon;
  tone: string;
  pos: string;
  /** which side it flies in from: -1 left, 1 right */
  dir: -1 | 1;
  rot: number;
  /** hidden on small screens so the phone stays readable */
  extra?: boolean;
};

const STICKERS: StickerDef[] = [
  { step: 0, label: "Unique links", Icon: Link2, tone: "from-indigo-500 to-violet-500", pos: "right-[-9%] top-[7%] md:left-[-46%] lg:left-[-18%] xl:left-[-46%] md:right-auto md:top-[24%]", dir: -1, rot: 5 },
  { step: 0, label: "1 SMS only", Icon: MessageSquare, tone: "from-fuchsia-500 to-pink-500", pos: "right-[-10%] top-[12%] md:right-[-40%] lg:right-[-16%] xl:right-[-40%]", dir: 1, rot: 5, extra: true },
  { step: 0, label: "CSV imported", Icon: FileSpreadsheet, tone: "from-sky-500 to-cyan-500", pos: "right-[-8%] top-[64%] md:right-[-44%] lg:right-[-16%] xl:right-[-44%]", dir: 1, rot: -4, extra: true },

  { step: 1, label: "Delivered", Icon: CheckCheck, tone: "from-emerald-500 to-teal-500", pos: "right-[-9%] top-[7%] md:left-[-38%] lg:left-[-18%] xl:left-[-38%] md:right-auto md:top-[28%]", dir: -1, rot: 5 },
  { step: 1, label: "Retrying failed sends", Icon: RefreshCw, tone: "from-amber-500 to-orange-500", pos: "right-[-10%] top-[46%] md:right-[-52%] lg:right-[-16%] xl:right-[-52%]", dir: 1, rot: 6, extra: true },
  { step: 1, label: "Queued → Sent", Icon: Send, tone: "from-blue-500 to-indigo-500", pos: "left-[-8%] top-[66%] md:left-[-42%] lg:left-[-18%] xl:left-[-42%]", dir: -1, rot: 4, extra: true },

  { step: 2, label: "Link clicked", Icon: MousePointerClick, tone: "from-blue-500 to-cyan-500", pos: "right-[-9%] top-[7%] md:right-[-40%] lg:right-[-16%] xl:right-[-40%] md:top-[22%]", dir: 1, rot: 5 },
  { step: 2, label: "Bot click ignored", Icon: ShieldCheck, tone: "from-slate-500 to-slate-700", pos: "left-[-12%] top-[40%] md:left-[-46%] lg:left-[-18%] xl:left-[-46%]", dir: -1, rot: -6, extra: true },
  { step: 2, label: "15% click rate", Icon: Sparkles, tone: "from-emerald-500 to-green-500", pos: "right-[-8%] top-[68%] md:right-[-38%] lg:right-[-16%] xl:right-[-38%]", dir: 1, rot: -3, extra: true },

  { step: 3, label: "Hot lead", Icon: Flame, tone: "from-amber-500 to-red-500", pos: "right-[-9%] top-[7%] md:left-[-34%] lg:left-[-18%] xl:left-[-34%] md:right-auto md:top-[26%]", dir: -1, rot: 5 },
  { step: 3, label: "Export CSV", Icon: Download, tone: "from-violet-500 to-purple-600", pos: "right-[-8%] top-[42%] md:right-[-38%] lg:right-[-16%] xl:right-[-38%]", dir: 1, rot: 5, extra: true },
  { step: 3, label: "Retarget in one click", Icon: Repeat, tone: "from-rose-500 to-pink-500", pos: "left-[-8%] top-[68%] md:left-[-46%] lg:left-[-18%] xl:left-[-46%]", dir: -1, rot: 3, extra: true },
];

/* --------------------------------------------------------------- helpers */

function useReducedMotionSafe() {
  // Read after mount so server and first client render match.
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const on = () => setReduce(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduce;
}

function Stars({ p }: { p?: MotionValue<number> }) {
  const fallback = useMotionValue(0);
  const y = useTransform(p ?? fallback, [0, 1], [0, -180]);
  // deterministic pseudo-random positions (no hydration mismatch)
  const dots = Array.from({ length: 38 }, (_, i) => ({
    left: (i * 53.7) % 100,
    top: (i * 31.3 + (i % 5) * 9) % 100,
    size: 1 + (i % 3),
    o: 0.25 + ((i * 7) % 5) / 10,
  }));
  return (
    <motion.div aria-hidden="true" style={{ y }} className="absolute inset-x-0 -top-[10%] h-[130%]">
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-slate-500 dark:bg-white"
          style={{ left: `${d.left}%`, top: `${d.top}%`, width: d.size, height: d.size, opacity: d.o }}
        />
      ))}
    </motion.div>
  );
}

function Backdrop({ p }: { p?: MotionValue<number> }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(100,116,139,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.12)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_30%,#000_35%,transparent_100%)] dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.09)_1px,transparent_1px)]" />
      <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-500/25 via-blue-500/20 to-cyan-400/20 blur-[120px] motion-safe:animate-aurora dark:from-indigo-500/30 dark:via-blue-600/20 dark:to-cyan-500/15" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[420px] w-[520px] rounded-full bg-fuchsia-400/10 blur-[130px] dark:bg-fuchsia-500/10" />
      <Stars p={p} />
    </div>
  );
}

function HeroCopy({ className }: { className?: string }) {
  return (
    <div className={cn("mx-auto max-w-3xl text-center", className)}>
      <div className="mb-5 flex justify-center">
        <a
          href="#features"
          className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm backdrop-blur transition-colors hover:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-indigo-400/50"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />
          Every recipient gets their own link
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </a>
      </div>

      <h1 className="font-display text-balance text-[2.15rem] font-extrabold leading-[1.08] tracking-tight text-slate-900 dark:text-white sm:text-6xl">
        Stop guessing who <GradientText>read your SMS</GradientText>
      </h1>

      <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-slate-600 dark:text-slate-300 sm:mt-5 sm:text-lg">
        {BRAND.name} gives every recipient a unique short link. See exactly who clicked, and follow up with the people who are ready to buy.
      </p>

      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row">
        <ShimmerButton href="/register" className="w-full sm:w-auto">
          Start free
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </ShimmerButton>
        <ShimmerButton href="/login" variant="ghost" className="w-full sm:w-auto">
          Sign in
        </ShimmerButton>
      </div>

      <ul className="mt-5 hidden flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-400 min-[700px]:flex">
        {["50 free credits after phone verification", "No credit card needed"].map((t) => (
          <li key={t} className="inline-flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Screen-reader / SEO copy for the animated steps. */
function StepsForScreenReaders() {
  return (
    <div className="sr-only">
      <h2>How {BRAND.name} works</h2>
      <ol>
        {STEPS.map((s) => (
          <li key={s.title}>
            <strong>{s.title}.</strong> {s.body}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* --------------------------------------------------------------- sticker */

function Sticker({ p, def }: { p: MotionValue<number>; def: StickerDef }) {
  const w = windowFor(def.step);
  const opacity = useTransform(p, w, [0, 1, 1, 0]);
  const scale = useTransform(p, w, [0.6, 1, 1, 0.8]);
  const dir = def.dir;
  const x = useTransform(p, w, [dir * 46, 0, 0, dir * 20]);
  const y = useTransform(p, [0, 1], [30, -30]);
  const Icon = def.Icon;

  return (
    <motion.div
      aria-hidden="true"
      style={{ opacity, scale, x, y, rotate: def.rot }}
      className={cn("pointer-events-none absolute z-30", def.pos, def.extra && "max-sm:hidden")}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-2xl border-[3px] border-white bg-gradient-to-br px-2.5 py-1.5 text-[11px] font-bold text-white shadow-[0_12px_28px_-8px_rgba(0,0,0,0.6)] md:gap-2 md:px-3 md:py-2 md:text-[13px]",
          def.tone
        )}
      >
        <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
        {def.label}
      </span>
    </motion.div>
  );
}

/* ------------------------------------------------------------- captions */

function Caption({ p, i, align }: { p: MotionValue<number>; i: number; align: "center" | "left" }) {
  const w = windowFor(i);
  const opacity = useTransform(p, w, [0, 1, 1, 0]);
  const y = useTransform(p, w, [18, 0, 0, -18]);
  return (
    <motion.div
      style={{ opacity, y }}
      className={cn("absolute inset-x-0 top-0", align === "center" ? "text-center" : "text-left")}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">Step {i + 1} of 4</p>
      <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white lg:text-3xl">{STEPS[i].title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-slate-600 dark:text-slate-300 lg:mx-0 lg:text-base">{STEPS[i].body}</p>
    </motion.div>
  );
}

function StepList({ p, active }: { p: MotionValue<number>; active: number }) {
  const line = useTransform(p, [0.2, 1], [0, 1], { clamp: true });
  const opacity = useTransform(p, [0.14, 0.22], [0, 1]);
  return (
    <motion.div style={{ opacity }} className="relative pl-6">
      <span aria-hidden="true" className="absolute bottom-2 left-[7px] top-2 w-px bg-slate-300 dark:bg-white/10" />
      <motion.span aria-hidden="true" style={{ scaleY: line }} className="absolute bottom-2 left-[7px] top-2 w-px origin-top bg-gradient-to-b from-indigo-400 to-cyan-300" />
      <ol className="space-y-5">
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative">
            <span
              aria-hidden="true"
              className={cn(
                "absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full border-2 transition-all duration-300",
                i <= active ? "border-indigo-400 bg-indigo-500 shadow-[0_0_14px_rgba(99,102,241,0.6)]" : "border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-900"
              )}
            />
            <p className={cn("text-sm font-semibold transition-colors duration-300", i === active ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500")}>{s.title}</p>
          </li>
        ))}
      </ol>
    </motion.div>
  );
}

/* ------------------------------------------------------------ main hero */

function PinnedHero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 32, mass: 0.4 });

  const [active, setActive] = useState(0);

  // Where the phone rests before scrolling: right under the headline block with a comfortable gap, but never
  // lower than "only its top ~96px shows" — so there is no big empty hole on tall screens and it never rides
  // up into the buttons on short ones.
  const phoneBox = useRef<HTMLDivElement>(null);
  const copyBox = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState(420);
  useEffect(() => {
    const measure = () => {
      const phone = phoneBox.current;
      const copy = copyBox.current;
      if (!phone) return;
      const naturalTop = phone.getBoundingClientRect().top; // the wrapper itself is not transformed
      const copyBottom = copy ? copy.offsetTop + copy.offsetHeight : 0;
      const desiredTop = Math.min(window.innerHeight - 96, copyBottom + 90);
      setStartY(Math.max(0, Math.round(desiredTop - naturalTop)));
    };
    measure();
    window.addEventListener("resize", measure);
    const ro = typeof ResizeObserver !== "undefined" && copyBox.current ? new ResizeObserver(measure) : null;
    if (ro && copyBox.current) ro.observe(copyBox.current);
    return () => {
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, []);

  useMotionValueEvent(p, "change", (v) => {
    const a = activeFromProgress(v);
    setActive((prev) => (prev === a ? prev : a));
  });

  // headline leaves, phone arrives
  // Order matters: the copy is fully gone (by p = 0.07) before the phone climbs into its space, and the
  // phone is layered above the copy, so a half-faded headline can never show through the phone.
  const copyOpacity = useTransform(p, [0, 0.07], [1, 0]);
  const copyY = useTransform(p, [0, 0.1], [0, -50]);
  const copyEvents = useTransform(p, (v) => (v > 0.03 ? "none" : "auto"));
  const phoneY = useTransform(p, [0, 0.04, 0.22], [startY, startY, 0]);
  const phoneScale = useTransform(p, [0.04, 0.22], [0.92, 1]);
  const phoneTilt = useTransform(p, [0.04, 0.22], [14, 0]);
  const hintOpacity = useTransform(p, [0, 0.06], [1, 0]);

  const t0 = useTransform(p, [stepStart(0), stepEnd(0)], [0, 1], { clamp: true });
  const t1 = useTransform(p, [stepStart(1), stepEnd(1)], [0, 1], { clamp: true });
  const t2 = useTransform(p, [stepStart(2), stepEnd(2)], [0, 1], { clamp: true });
  const t3 = useTransform(p, [stepStart(3), stepEnd(3)], [0, 1], { clamp: true });
  const ts = [t0, t1, t2, t3];

  return (
    <section ref={ref} className="relative h-[520svh]" aria-label={`${BRAND.name} overview`}>
      <div className="sticky top-0 h-dvh overflow-hidden">
        <Backdrop p={p} />

        {/* Headline + calls to action */}
        <motion.div
          ref={copyBox}
          style={{ opacity: copyOpacity, y: copyY, pointerEvents: copyEvents }}
          className="absolute inset-x-0 top-0 z-[5] px-4 pt-[88px] sm:px-6 sm:pt-[112px]"
        >
          <HeroCopy />
        </motion.div>

        {/* Step captions: top on phones, left column on desktop */}
        <div className="pointer-events-none absolute inset-x-6 top-[88px] z-20 h-[130px] lg:hidden">
          {STEPS.map((_, i) => (
            <Caption key={i} p={p} i={i} align="center" />
          ))}
        </div>
        <div className="pointer-events-none absolute top-1/2 z-20 hidden h-[190px] w-[300px] -translate-y-1/2 lg:left-[max(2rem,calc(50%-620px))] lg:block">
          {STEPS.map((_, i) => (
            <Caption key={i} p={p} i={i} align="left" />
          ))}
        </div>

        {/* Step list, desktop */}
        <div className="absolute top-1/2 z-20 hidden w-[240px] -translate-y-1/2 lg:right-[max(2rem,calc(50%-600px))] lg:block">
          <StepList p={p} active={active} />
        </div>

        {/* Phone */}
        <div ref={phoneBox} className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center [perspective:1400px] lg:bottom-auto lg:top-[calc(50%+26px)] lg:-translate-y-1/2">
          <motion.div style={{ y: phoneY, scale: phoneScale, rotateX: phoneTilt }} className="relative will-change-transform">
            <div className="relative h-[min(66dvh,560px)] lg:h-[min(74dvh,620px)]" aria-hidden="true">
              <PhoneFrame active={active} className="h-full">
                {SCREENS.map((Screen, i) => (
                  <ScreenLayer key={i} p={p} i={i}>
                    <Screen t={ts[i]} />
                  </ScreenLayer>
                ))}
              </PhoneFrame>

              {STICKERS.map((s, i) => (
                <Sticker key={i} p={p} def={s} />
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] text-slate-500">Sample data</p>
          </motion.div>
        </div>

        <motion.div
          aria-hidden="true"
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute bottom-6 left-8 z-20 hidden lg:flex"
        >
          <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs text-slate-600 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <span className="h-4 w-2.5 rounded-full border border-slate-400 p-[2px]">
              <span className="block h-1 w-full rounded-full bg-slate-500 dark:bg-slate-300 motion-safe:animate-bounce" />
            </span>
            Scroll to explore
          </span>
        </motion.div>
      </div>
      <StepsForScreenReaders />
    </section>
  );
}

function ScreenLayer({ p, i, children }: { p: MotionValue<number>; i: number; children: React.ReactNode }) {
  const w = windowFor(i);
  const opacity = useTransform(p, w, [i === 0 ? 1 : 0, 1, 1, 0]);
  const scale = useTransform(p, w, [1.03, 1, 1, 0.97]);
  return (
    <motion.div style={{ opacity, scale }} className="absolute inset-0">
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------- reduced motion */

function StaticHero() {
  const t = useMotionValue(0.9);
  return (
    <section className="relative overflow-hidden pb-20 pt-28 sm:pt-36" aria-label={`${BRAND.name} overview`}>
      <Backdrop />
      <div className="relative z-10 px-4 sm:px-6">
        <HeroCopy />
        <h2 className="mt-16 text-center font-display text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">How {BRAND.name} works</h2>
        <ol className="mx-auto mt-10 grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => {
            const Screen = SCREENS[i];
            return (
              <li key={s.title} className="flex flex-col items-center text-center">
                <div className="h-[430px]" aria-hidden="true">
                  <PhoneFrame active={i} className="h-full">
                    <Screen t={t} />
                  </PhoneFrame>
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">Step {i + 1}</p>
                <h3 className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-white">{s.title}</h3>
                <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-300">{s.body}</p>
              </li>
            );
          })}
        </ol>
        <p className="mt-8 text-center text-[11px] text-slate-500">Sample data</p>
      </div>
    </section>
  );
}

export function ScrollHero() {
  const reduce = useReducedMotionSafe();
  return reduce ? <StaticHero /> : <PinnedHero />;
}
