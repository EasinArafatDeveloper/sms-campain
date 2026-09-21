"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Gift, Link2, Lock, Plus, Server, ShieldCheck, type LucideIcon } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Reveal, ShimmerButton } from "./fx";

const FAQS: { q: string; a: string; icon: LucideIcon; tone: string }[] = [
  {
    q: "How do short links keep my SMS cheap?",
    a: "A normal URL can push a message over 160 characters and turn one SMS into two or three. Short unique links keep most messages within a single SMS, so you use fewer credits.",
    icon: Link2,
    tone: "from-indigo-500 to-violet-600",
  },
  {
    q: "Can I use my own SMS gateway?",
    a: `Yes. Connect your own ZendSMS API key and sender ID in Settings and test the connection. Without one, ${BRAND.name} sends through its shared gateway using your workspace credits.`,
    icon: Server,
    tone: "from-sky-500 to-blue-600",
  },
  {
    q: "Will link previews count as clicks?",
    a: "Many phones fetch links in the background to build a preview. We filter known preview crawlers and prefetch requests so your numbers are closer to real human clicks. No filter is perfect, but it removes most of the noise.",
    icon: ShieldCheck,
    tone: "from-emerald-500 to-teal-600",
  },
  {
    q: "What is a hot lead?",
    a: "A contact who has clicked links in at least three different campaigns, with a recent click in the last 30 days. You can export them or start a retargeting campaign from that list.",
    icon: Flame,
    tone: "from-amber-500 to-orange-600",
  },
  {
    q: "How do I get free credits?",
    a: "Create an account and verify your phone number with a one-time code. 50 free credits are added to your workspace. Need more later? Ask our team to top up your balance.",
    icon: Gift,
    tone: "from-fuchsia-500 to-pink-600",
  },
  {
    q: "Is my data separate from other customers?",
    a: "Yes. Every workspace has its own contacts, campaigns and analytics, and all data access is scoped to your workspace.",
    icon: Lock,
    tone: "from-slate-500 to-slate-700",
  },
];

function FaqCta({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-600 p-6 text-white shadow-xl shadow-indigo-600/25">
        <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
        <p className="relative font-display text-lg font-bold">Rather just try it?</p>
        <p className="relative mt-1 text-sm text-indigo-100">Create an account and send your first tracked campaign with 50 free credits.</p>
        <div className="relative mt-5">
          <ShimmerButton href="/register" className="!h-11 !bg-white !text-slate-950 !shadow-none">
            Start free
          </ShimmerButton>
        </div>
      </div>
    </div>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-20 sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_50%_50%_at_20%_0%,rgba(99,102,241,0.09),transparent)]" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:gap-16">
        {/* left: intro + call to action */}
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-300">
            FAQ
          </p>
          <h2 className="mt-4 font-display text-balance text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Questions, answered</h2>
          <p className="mt-4 max-w-md text-pretty text-base text-slate-600 dark:text-slate-300">Short answers to the things people ask before they start.</p>

          <FaqCta className="mt-8 hidden lg:block" />
        </Reveal>

        {/* right: accordion */}
        <div className="space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            const Icon = f.icon;
            return (
              <Reveal key={f.q} delay={i * 0.05}>
                <div
                  className={cn(
                    "relative overflow-hidden rounded-2xl border bg-white/80 transition-all duration-300 dark:bg-white/[0.03]",
                    isOpen
                      ? "border-indigo-300 shadow-lg shadow-indigo-500/10 dark:border-indigo-400/40"
                      : "border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20"
                  )}
                >
                  <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1 bg-gradient-to-b transition-opacity duration-300", f.tone, isOpen ? "opacity-100" : "opacity-0")} />
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${i}`}
                      id={`faq-trigger-${i}`}
                      className="flex min-h-[64px] w-full items-center gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                    >
                      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md", f.tone)}>
                        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      </span>
                      <span className="flex-1 text-[15px] font-semibold text-slate-900 dark:text-white">{f.q}</span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                          isOpen ? "rotate-45 border-indigo-300 bg-indigo-50 text-indigo-600 dark:border-indigo-400/40 dark:bg-indigo-500/15 dark:text-indigo-300" : "border-slate-200 text-slate-400 dark:border-white/10"
                        )}
                      >
                        <Plus className="h-4 w-4" />
                      </span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-panel-${i}`}
                        role="region"
                        aria-labelledby={`faq-trigger-${i}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 pl-[76px] pr-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
          <FaqCta className="pt-2 lg:hidden" />
        </div>
      </div>
    </section>
  );
}
