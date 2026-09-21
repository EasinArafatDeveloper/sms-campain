"use client";

import React from "react";
import { Link2, ShieldCheck, Flame, Truck, FileSpreadsheet } from "lucide-react";
import { Reveal, SpotlightCard } from "./fx";
import { BotVisual, CsvVisual, DeliveryVisual, HotVisual, LinksVisual } from "./feature-visuals";

export function SectionHead({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <Reveal className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
      <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-300">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-display text-balance text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{title}</h2>
      <p className="mt-4 text-pretty text-base text-slate-600 dark:text-slate-300">{body}</p>
    </Reveal>
  );
}

function FeatureCard({
  icon: Icon,
  tile,
  glow,
  title,
  body,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  /** gradient of the icon tile */
  tile: string;
  /** soft coloured light in the card corner */
  glow: string;
  title: string;
  body: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <SpotlightCard className={`flex h-full flex-col p-6 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 sm:p-7 ${className ?? ""}`}>
      <span aria-hidden="true" className={`pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full opacity-40 blur-3xl dark:opacity-30 ${glow}`} />
      <span className={`relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ring-1 ring-white/30 ${tile}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-400">{body}</p>
      <div className="mt-6 flex flex-1 flex-col justify-end">{children}</div>
    </SpotlightCard>
  );
}

export function Features() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(99,102,241,0.10),transparent)]" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead
          eyebrow="Features"
          title="Everything you need to see what your SMS actually does"
          body="Send like you always do. The difference is that every message can be traced back to a person, a click and a result."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <Reveal className="md:col-span-4">
            <FeatureCard
              icon={Link2}
              tile="from-indigo-500 to-violet-600 shadow-indigo-500/30"
              glow="bg-indigo-500"
              title="A short, unique link for every recipient"
              body={
                <>
                  Add <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-indigo-700 dark:bg-white/10 dark:text-indigo-300">{"{TRACKABLE_LINK}"}</code> to your message. Each contact gets a compact link of their own, so your text stays short and you know exactly who tapped.
                </>
              }
            >
              <LinksVisual />
            </FeatureCard>
          </Reveal>

          <Reveal delay={0.08} className="md:col-span-2">
            <FeatureCard
              icon={ShieldCheck}
              tile="from-emerald-500 to-teal-600 shadow-emerald-500/30"
              glow="bg-emerald-500"
              title="Cleaner click numbers"
              body="Link-preview crawlers and prefetch requests are filtered out, so a click means a person."
            >
              <BotVisual />
            </FeatureCard>
          </Reveal>

          <Reveal delay={0.04} className="md:col-span-2">
            <FeatureCard
              icon={Flame}
              tile="from-amber-500 to-orange-600 shadow-amber-500/30"
              glow="bg-amber-500"
              title="Hot leads, found for you"
              body="People who keep clicking across campaigns are flagged as high-intent, ready to retarget in one click."
            >
              <HotVisual />
            </FeatureCard>
          </Reveal>

          <Reveal delay={0.08} className="md:col-span-2">
            <FeatureCard
              icon={Truck}
              tile="from-sky-500 to-blue-600 shadow-sky-500/30"
              glow="bg-sky-500"
              title="Delivery you can follow"
              body="Watch messages move from queued to delivered. Failed sends are retried automatically."
            >
              <DeliveryVisual />
            </FeatureCard>
          </Reveal>

          <Reveal delay={0.12} className="md:col-span-2">
            <FeatureCard
              icon={FileSpreadsheet}
              tile="from-fuchsia-500 to-pink-600 shadow-fuchsia-500/30"
              glow="bg-fuchsia-500"
              title="Import contacts in seconds"
              body="Upload a CSV or paste numbers. Bangladeshi formats are cleaned up and invalid numbers are skipped."
            >
              <CsvVisual />
            </FeatureCard>
          </Reveal>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">Illustrations use sample data.</p>
      </div>
    </section>
  );
}
