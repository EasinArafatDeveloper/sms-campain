"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Check, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface GettingStartedProps {
  phoneVerified: boolean;
  /** shown when the current date range has no campaigns but the workspace might have older ones */
  onShowAllTime?: () => void;
  isAllTime: boolean;
}

/** Shown instead of empty charts when there are no campaigns yet. Only the phone step can be detected. */
export function GettingStarted({ phoneVerified, onShowAllTime, isAllTime }: GettingStartedProps) {
  const steps = [
    {
      title: "Verify your phone number",
      body: "Get 50 free credits to send with.",
      done: phoneVerified,
      href: "/profile",
      cta: "Verify phone",
    },
    {
      title: "Write your first campaign",
      body: "Add contacts and a message with {TRACKABLE_LINK}.",
      done: false,
      href: "/campaigns/new",
      cta: "Create campaign",
    },
    {
      title: "Send it and watch the clicks",
      body: "Delivery and clicks appear here as they happen.",
      done: false,
      href: "/campaigns/new",
      cta: "Start",
    },
  ];
  const current = steps.findIndex((s) => !s.done);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6 shadow-sm dark:border-indigo-400/20 dark:from-indigo-500/10 dark:via-slate-900 dark:to-cyan-500/5 sm:p-8">
      <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="relative flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Send your first campaign</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {isAllTime ? "You have no campaigns yet. Three quick steps:" : "No campaigns in this period. If you have older ones, look at all time."}
          </p>
        </div>
        {!isAllTime && onShowAllTime && (
          <button type="button" onClick={onShowAllTime} className="mt-3 self-start text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300 sm:mt-0">
            Show all time
          </button>
        )}
      </div>

      <ol className="relative mt-6 grid gap-3 md:grid-cols-3">
        {steps.map((s, i) => {
          const isCurrent = i === current;
          return (
            <li
              key={s.title}
              className={cn(
                "flex flex-col rounded-2xl border p-4 transition-colors",
                s.done
                  ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-400/20 dark:bg-emerald-500/10"
                  : isCurrent
                  ? "border-indigo-300 bg-white shadow-md shadow-indigo-500/10 dark:border-indigo-400/40 dark:bg-slate-900"
                  : "border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                  s.done ? "bg-emerald-500 text-white" : isCurrent ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                )}
              >
                {s.done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{s.title}</p>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{s.body}</p>
              {!s.done && isCurrent && (
                <Link
                  href={s.href}
                  className="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-3.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
                >
                  {i === 1 ? <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                  {s.cta}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              )}
              {s.done && <p className="mt-4 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Done</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
