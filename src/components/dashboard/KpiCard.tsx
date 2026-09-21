"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NumberTicker } from "@/components/landing/fx";

const TONES = {
  indigo: { tile: "from-indigo-500 to-violet-600 shadow-indigo-500/30", glow: "bg-indigo-500" },
  blue: { tile: "from-blue-500 to-sky-600 shadow-blue-500/30", glow: "bg-blue-500" },
  emerald: { tile: "from-emerald-500 to-teal-600 shadow-emerald-500/30", glow: "bg-emerald-500" },
  amber: { tile: "from-amber-500 to-orange-600 shadow-amber-500/30", glow: "bg-amber-500" },
  rose: { tile: "from-rose-500 to-red-600 shadow-rose-500/30", glow: "bg-rose-500" },
} as const;

export type KpiTone = keyof typeof TONES;

interface KpiCardProps {
  label: string;
  value: number;
  /** e.g. "%" */
  suffix?: string;
  decimals?: number;
  sub: React.ReactNode;
  icon: LucideIcon;
  tone?: KpiTone;
  /** makes the whole card a link */
  href?: string;
}

/** Big-number card. The number counts up when it first appears; the accent colour signals the state. */
export function KpiCard({ label, value, suffix, decimals, sub, icon: Icon, tone = "indigo", href }: KpiCardProps) {
  const t = TONES[tone];

  const body = (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 dark:border-white/10 dark:bg-slate-900",
        href && "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10"
      )}
    >
      <span aria-hidden="true" className={cn("pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full opacity-[0.14] blur-2xl transition-opacity group-hover:opacity-25", t.glow)} />

      <div className="relative flex items-start justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ring-1 ring-white/30", t.tile)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <p className="relative mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        <NumberTicker value={value} suffix={suffix} decimals={decimals} />
      </p>
      <p className="relative mt-1.5 text-xs leading-snug text-slate-500 dark:text-slate-400">{sub}</p>

      {href && <ArrowUpRight aria-hidden="true" className="absolute bottom-4 right-4 h-4 w-4 text-slate-300 transition-colors group-hover:text-indigo-500 dark:text-slate-600" />}
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
      {body}
    </Link>
  ) : (
    body
  );
}
