"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { Reveal, ShimmerButton, SpotlightCard } from "./fx";
import { SectionHead } from "./Features";
import { ComposeVisual, ResultsVisual, SendVisual } from "./feature-visuals";

const STEPS = [
  {
    n: "01",
    title: "Add contacts and write your message",
    body: (
      <>
        Upload a CSV or paste numbers, then drop{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-indigo-700 dark:bg-white/10 dark:text-indigo-300">{"{TRACKABLE_LINK}"}</code> where the link should go.
      </>
    ),
    glow: "bg-indigo-500",
    Visual: ComposeVisual,
  },
  {
    n: "02",
    title: "Send it",
    body: "Each contact gets their own short link. Messages are queued, sent and tracked all the way to delivery.",
    glow: "bg-sky-500",
    Visual: SendVisual,
  },
  {
    n: "03",
    title: "See who clicked, follow up with who matters",
    body: "Watch clicks come in, find your hot leads, then export them or retarget them with a new campaign.",
    glow: "bg-amber-500",
    Visual: ResultsVisual,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden py-20 sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-indigo-50/70 to-transparent dark:via-indigo-500/[0.06]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,rgba(100,116,139,0.18)_1px,transparent_0)] bg-[size:26px_26px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_30%,transparent_100%)]" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead
          eyebrow="How it works"
          title="From contact list to clear results in three steps"
          body="No setup project. Create an account, verify your phone number and you can send your first tracked campaign."
        />

        <ol className="mx-auto grid max-w-xl grid-cols-1 gap-6 lg:max-w-none lg:grid-cols-3 lg:gap-8">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 0.1} className="relative">
              <SpotlightCard className="flex h-full flex-col p-6 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10">
                <span aria-hidden="true" className={`pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full opacity-30 blur-3xl ${s.glow}`} />
                <span className="font-display text-5xl font-extrabold leading-none tracking-tight text-transparent [-webkit-text-stroke:1.5px_rgba(99,102,241,0.55)]">
                  {s.n}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold leading-snug tracking-tight text-slate-900 dark:text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{s.body}</p>
                <div className="mt-6 flex flex-1 flex-col justify-end">
                  <s.Visual />
                </div>
              </SpotlightCard>

              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-[34px] top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-indigo-600 shadow-md dark:border-white/10 dark:bg-slate-900 dark:text-indigo-300 lg:flex"
                >
                  <span className="absolute inset-0 rounded-full bg-indigo-500/20 motion-safe:animate-ping" />
                  <ArrowRight className="relative h-4 w-4" />
                </span>
              )}
            </Reveal>
          ))}
        </ol>

        <Reveal className="mt-12 flex justify-center">
          <ShimmerButton href="/register">
            Try it free
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ShimmerButton>
        </Reveal>
      </div>
    </section>
  );
}
