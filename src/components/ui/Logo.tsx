import React from "react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

/** Brand mark: a paper plane on a gradient tile. Pure SVG, no external assets. */
export function LogoMark({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-[28%] bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 shadow-lg shadow-blue-600/30 ring-1 ring-white/20",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
        <path d="M21.5 3.2 2.9 10.4c-.8.3-.8 1.4 0 1.7l6.1 2.3 2.3 6.1c.3.8 1.4.8 1.7 0L21.9 4.1c.3-.7-.3-1.2-.4-.9Z" fill="white" fillOpacity=".95" />
        <path d="m9 14.4 12.5-11.2" stroke="#4F46E5" strokeOpacity=".55" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  size = 36,
  showName = true,
  tone = "auto",
}: {
  className?: string;
  size?: number;
  showName?: boolean;
  /** "light" forces white text (use on an always-dark background) */
  tone?: "auto" | "light";
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {showName && (
        <span className={cn("font-display text-lg font-extrabold tracking-tight", tone === "light" ? "text-white" : "text-slate-900 dark:text-white")}>
          {BRAND.name}
        </span>
      )}
    </span>
  );
}
