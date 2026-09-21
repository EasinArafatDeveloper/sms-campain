"use client";

import React from "react";
import { Marquee } from "./fx";

const CAPABILITIES = [
  "Unique short link per recipient",
  "Delivery reports",
  "Bot & preview click filter",
  "CSV contact import",
  "Hot-lead scoring",
  "One-click retargeting",
  "CSV export",
  "Your own ZendSMS account",
];

export function CapabilityStrip() {
  return (
    <div className="border-y border-slate-200/70 bg-white/60 py-5 backdrop-blur dark:border-white/5 dark:bg-slate-950">
      <Marquee>
        {CAPABILITIES.map((c) => (
          <span key={c} className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
            {c}
          </span>
        ))}
      </Marquee>
    </div>
  );
}
