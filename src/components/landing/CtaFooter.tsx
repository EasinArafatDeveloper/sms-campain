import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUp, CheckCircle2 } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { Logo } from "@/components/ui/Logo";
import { Reveal, ShimmerButton } from "./fx";

export function Cta() {
  return (
    <section className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-slate-900 px-6 py-14 text-center text-white shadow-2xl dark:border dark:border-white/10 dark:bg-slate-900 sm:px-12 sm:py-20">
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_75%)]" />
            <div aria-hidden="true" className="absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-indigo-500/40 blur-[110px]" />

            <h2 className="mx-auto max-w-2xl text-balance font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              Send your first tracked campaign today
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-pretty text-base text-slate-300">
              Create an account, verify your phone and get 50 free credits. See real click data from your very first message.
            </p>
            <div className="mt-8 flex justify-center">
              <ShimmerButton href="/register" className="!bg-white !text-slate-950 !shadow-white/10">
                Start free
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ShimmerButton>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Cost estimator", href: "#estimator" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Create free account", href: "/register" },
      { label: "Sign in", href: "/login" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200/70 bg-white dark:border-white/5 dark:bg-slate-950">
      <div aria-hidden="true" className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[100px] dark:bg-indigo-500/15" />

      <div className="relative mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* brand */}
          <div className="max-w-sm">
            <Logo size={34} />
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {BRAND.shortDescription}
            </p>
            <Link
              href="/register"
              className="group mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-600/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.97] dark:focus-visible:ring-offset-slate-950"
            >
              Start free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          {/* link columns */}
          {FOOTER_COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">{col.title}</h3>
              <ul className="mt-4 space-y-3 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("#") ? (
                      <a href={l.href} className="text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300">
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className="text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* facts */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Good to know</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
              {[
                "50 free credits after phone verification",
                "Pay for credits, no monthly subscription",
                "Messages delivered through ZendSMS",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200/70 py-6 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400 sm:flex-row">
          <p>
            © {BRAND.year} {BRAND.name}. All rights reserved.
          </p>
          <a
            href="#"
            className="group inline-flex items-center gap-1.5 font-medium transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            Back to top
            <ArrowUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* oversized wordmark */}
      <div aria-hidden="true" className="pointer-events-none relative select-none overflow-hidden px-4 pb-2 text-center">
        <span className="block bg-gradient-to-b from-slate-200 to-transparent bg-clip-text font-display text-[clamp(4rem,19vw,15rem)] font-extrabold leading-[0.85] tracking-tighter text-transparent dark:from-white/10">
          {BRAND.name}
        </span>
      </div>
    </footer>
  );
}
