"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

/**
 * Shared frame for the sign-in and sign-up pages: an always-dark brand panel on the left (desktop only)
 * with a live product illustration, and the form on the right that follows the light/dark theme.
 */
export function AuthShell({
  headline,
  copy,
  visual,
  footnote,
  children,
}: {
  headline: React.ReactNode;
  copy: string;
  visual: React.ReactNode;
  footnote: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <div className="relative grid min-h-dvh bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white dark:bg-slate-950 dark:text-slate-100 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* ------------------------------------------------ brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:flex">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_70%_at_30%_30%,#000_30%,transparent_100%)]" />
          <div className="absolute -left-24 -top-24 h-[420px] w-[520px] rounded-full bg-indigo-600/30 blur-[110px] motion-safe:animate-aurora" />
          <div className="absolute -bottom-24 -right-16 h-[360px] w-[420px] rounded-full bg-cyan-500/15 blur-[110px]" />
          <div className="absolute bottom-1/3 -left-10 h-64 w-64 rounded-full bg-fuchsia-600/15 blur-[100px]" />
        </div>

        <div className="relative">
          <Link href="/" aria-label="Back to home" className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
            <Logo size={40} tone="light" />
          </Link>
        </div>

        <div className="relative space-y-8">
          <div className="space-y-4">
            <h2 className="font-display text-balance text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-[2.6rem]">{headline}</h2>
            <p className="max-w-md text-pretty text-[15px] leading-relaxed text-slate-300">{copy}</p>
          </div>
          {visual}
        </div>

        <p className="relative text-xs text-slate-500">{footnote}</p>
      </aside>

      {/* ------------------------------------------------ form side */}
      <main className="relative flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Back to home" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:hidden">
            <Logo size={34} />
          </Link>
          <Link
            href="/"
            className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:text-white lg:inline-flex"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[26rem]"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
