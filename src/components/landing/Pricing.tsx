"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, CheckCheck, Coins, Gift, Loader2, Server, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, ShimmerButton, SpotlightCard } from "./fx";
import { SectionHead } from "./Features";
import { useTicker } from "./feature-visuals";

const spring = { type: "spring" as const, stiffness: 380, damping: 28 };

/* ------------------------------------------------- card 1: free credits ring */

function CreditsRing() {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden="true" className="relative mx-auto flex h-32 w-32 items-center justify-center">
      <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366f1" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r="34" fill="none" strokeWidth="7" className="stroke-slate-200 dark:stroke-white/10" />
        <motion.circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke="url(#ring)"
          strokeWidth="7"
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </svg>
      <div className="text-center leading-none">
        <p className="font-display text-4xl font-extrabold text-slate-900 dark:text-white">50</p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">free credits</p>
      </div>
    </div>
  );
}

/* --------------------------------------------- card 2: credits going up/down */

function BalanceVisual() {
  const { ref, n } = useTicker(700, 4);
  const s = n % 14;
  const sending = s >= 1 && s <= 6;
  const toppedUp = s >= 9;
  const balance = s <= 6 ? 250 - s * 22 : s < 9 ? 118 : 618;

  return (
    <div ref={ref} aria-hidden="true" className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Credit balance</p>
          <p className={cn("font-display text-3xl font-extrabold tabular-nums transition-colors duration-300", toppedUp ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white")}>
            {balance}
          </p>
        </div>
        <div className="relative h-7 w-[132px]">
          <AnimatePresence mode="wait">
            {sending && (
              <motion.span key="s" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring} className="absolute inset-0 inline-flex items-center justify-center rounded-full bg-indigo-50 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                Campaign sending…
              </motion.span>
            )}
            {toppedUp && (
              <motion.span key="t" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring} className="absolute inset-0 inline-flex items-center justify-center rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                +500 credits added
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
        <motion.div
          className="h-full origin-left rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
          animate={{ scaleX: Math.min(1, balance / 620) }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <p className="mt-2 text-[10.5px] text-slate-400">Sample balance</p>
    </div>
  );
}

/* --------------------------------------------- card 3: connect your gateway */

function GatewayVisual() {
  const { ref, n } = useTicker(800, 6);
  const s = n % 10;
  const testing = s === 4;
  const connected = s >= 5;

  const Row = ({ label, value, ok }: { label: string; value: string; ok: boolean }) => (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-slate-900/70">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-slate-700 dark:text-slate-200">
        {value}
        <span className={cn("flex h-4 w-4 items-center justify-center rounded-full transition-colors duration-300", ok ? "bg-emerald-500 text-white" : "bg-slate-200 text-transparent dark:bg-white/10")}>
          <Check className="h-2.5 w-2.5" />
        </span>
      </span>
    </div>
  );

  return (
    <div ref={ref} aria-hidden="true" className="space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-900/60">
      <Row label="API key" value="••••••••••" ok={s >= 2} />
      <Row label="Sender ID" value="8809612781020" ok={s >= 3} />
      <motion.div
        animate={{ scale: testing ? 0.97 : 1 }}
        className={cn(
          "flex h-9 items-center justify-center gap-2 rounded-lg text-xs font-bold transition-colors duration-300",
          connected ? "bg-emerald-500 text-white" : "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
        )}
      >
        {connected ? (
          <>
            <CheckCheck className="h-4 w-4" /> Connected
          </>
        ) : testing ? (
          <>
            <Loader2 className="h-4 w-4 motion-safe:animate-spin" /> Testing…
          </>
        ) : (
          "Test connection"
        )}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------- cards */

function Points({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
      {items.map((p) => (
        <li key={p} className="flex items-start gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
          {p}
        </li>
      ))}
    </ul>
  );
}

function IconTile({ icon: Icon, tone }: { icon: React.ComponentType<{ className?: string }>; tone: string }) {
  return (
    <span className={cn("mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ring-1 ring-white/30", tone)}>
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="relative overflow-hidden py-20 sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-indigo-50/60 to-transparent dark:via-indigo-500/[0.05]" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead
          eyebrow="Pricing"
          title="Pay for messages, not for a plan"
          body="Credits, not subscriptions. Start with free credits and top up as you grow."
        />

        <div className="mx-auto grid max-w-xl items-stretch gap-6 lg:max-w-none lg:grid-cols-3">
          {/* Highlighted: start free */}
          <Reveal className="relative lg:-mt-4 lg:mb-4">
            <div className="h-full rounded-[28px] bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 p-[1.5px] shadow-2xl shadow-indigo-500/25">
              <div className="relative flex h-full flex-col overflow-hidden rounded-[27px] bg-white p-7 dark:bg-slate-900">
                <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-indigo-500/25 blur-3xl" />
                <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-1 text-[11px] font-bold text-white shadow-md">
                  <Sparkles className="h-3 w-3" aria-hidden="true" /> Start here
                </span>
                <IconTile icon={Gift} tone="from-indigo-500 to-blue-600 shadow-indigo-500/30" />
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Start free</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">Create an account and verify your phone number to receive 50 free credits.</p>
                <div className="my-6">
                  <CreditsRing />
                </div>
                <Points items={["1 credit = 1 SMS", "All features included", "No credit card needed"]} />
                <div className="mt-auto pt-7">
                  <ShimmerButton href="/register" className="w-full">
                    Claim free credits
                  </ShimmerButton>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <SpotlightCard className="flex h-full flex-col p-7">
              <span aria-hidden="true" className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-emerald-500 opacity-25 blur-3xl" />
              <IconTile icon={Coins} tone="from-emerald-500 to-teal-600 shadow-emerald-500/30" />
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Add credits when you need them</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">No monthly subscription. You only use credits when you send.</p>
              <div className="mt-6">
                <BalanceVisual />
              </div>
              <Points items={["Pay for the SMS you send", "Ask our team to top up your workspace", "Balance shown in your dashboard"]} />
            </SpotlightCard>
          </Reveal>

          <Reveal delay={0.16}>
            <SpotlightCard className="flex h-full flex-col p-7">
              <span aria-hidden="true" className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-sky-500 opacity-25 blur-3xl" />
              <IconTile icon={Server} tone="from-sky-500 to-blue-600 shadow-sky-500/30" />
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Use your own gateway</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">Already have a ZendSMS account? Connect your API key and sender ID in Settings.</p>
              <div className="mt-6">
                <GatewayVisual />
              </div>
              <Points items={["Test the connection from Settings", "Sender ID stays yours"]} />
            </SpotlightCard>
          </Reveal>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">Illustrations use sample numbers.</p>
      </div>
    </section>
  );
}
