"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Calculator, CircleHelp, ListChecks, Menu, Moon, Sparkles, Sun, Tag, X, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

const LINKS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Features", href: "#features", icon: Sparkles },
  { label: "How it works", href: "#how-it-works", icon: ListChecks },
  { label: "Estimator", href: "#estimator", icon: Calculator },
  { label: "Pricing", href: "#pricing", icon: Tag },
  { label: "FAQ", href: "#faq", icon: CircleHelp },
];

function NavThemeButton({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-slate-600 transition-colors hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? "sun" : "moon"}
          initial={{ y: 14, opacity: 0, rotate: -40 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -14, opacity: 0, rotate: 40 }}
          transition={{ duration: 0.2 }}
          className="flex"
        >
          {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    let last = window.scrollY;
    const ids = LINKS.map((l) => l.href.slice(1));

    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);

      // Smart navbar: slides away while scrolling down, returns on scroll up
      if (y > last + 6 && y > 120) setHidden(true);
      else if (y < last - 6 || y <= 120) setHidden(false);
      last = y;

      // Scroll spy: the section crossing the upper-middle of the screen is the active one
      const mid = window.innerHeight * 0.4;
      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) current = id;
      }
      setActive((prev) => (prev === current ? prev : current));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const pillTarget = hovered ?? active;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-3 z-50 px-3 transition-transform duration-300 ease-out sm:top-4 sm:px-4",
        hidden && !open ? "-translate-y-[140%] focus-within:translate-y-0" : "translate-y-0"
      )}
    >
      <nav
        aria-label="Main"
        className={cn(
          "relative mx-auto max-w-5xl overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300",
          scrolled || open
            ? "border-slate-200/80 bg-white/80 shadow-[0_10px_40px_-12px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-slate-950/75 dark:shadow-black/40"
            : "border-white/60 bg-white/55 shadow-[0_6px_30px_-14px_rgba(15,23,42,0.15)] dark:border-white/10 dark:bg-white/[0.04]"
        )}
      >
        {/* soft top highlight */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent dark:via-white/30" />

        <div className={cn("flex items-center justify-between pl-4 pr-2 transition-[height] duration-300 sm:pr-2.5", scrolled ? "h-14" : "h-[62px]")}>
          <Link
            href="/"
            aria-label="Home"
            className="rounded-lg transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95"
          >
            <Logo size={34} />
          </Link>

          {/* desktop links */}
          <ul className="relative hidden items-center gap-0.5 lg:flex" onMouseLeave={() => setHovered(null)}>
            {LINKS.map((l) => {
              const id = l.href.slice(1);
              const isActive = active === id;
              return (
                <li key={l.href} className="relative">
                  <a
                    href={l.href}
                    onMouseEnter={() => setHovered(id)}
                    onFocus={() => setHovered(id)}
                    onBlur={() => setHovered(null)}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "relative z-10 block whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                      isActive || hovered === id ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"
                    )}
                  >
                    {l.label}
                  </a>
                  {pillTarget === id && (
                    <motion.span
                      layoutId="nav-pill"
                      aria-hidden="true"
                      className="absolute inset-0 rounded-lg bg-slate-900/[0.06] dark:bg-white/10"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  {isActive && (
                    <motion.span
                      layoutId="nav-lamp"
                      aria-hidden="true"
                      className="absolute -bottom-[3px] left-1/2 h-[3px] w-7 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-[0_0_12px_rgba(99,102,241,0.9)]"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <NavThemeButton className="hidden sm:flex" />
            <Link
              href="/login"
              className="hidden h-10 items-center whitespace-nowrap rounded-xl px-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-200 dark:hover:bg-white/10 sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="group relative inline-flex h-10 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-600/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.97] dark:focus-visible:ring-offset-slate-950"
            >
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent motion-safe:animate-shimmer" />
              <span className="relative">Get started</span>
              <ArrowRight className="relative h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-200 dark:hover:bg-white/10 lg:hidden"
            >
              {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* mobile menu */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden lg:hidden"
            >
              <ul className="space-y-1 px-3 pb-3 pt-1">
                {LINKS.map((l, i) => {
                  const Icon = l.icon;
                  const isActive = active === l.href.slice(1);
                  return (
                    <motion.li key={l.href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i + 0.05 }}>
                      <a
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex h-12 items-center gap-3 rounded-xl px-3 text-base font-medium transition-colors",
                          isActive
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                            : "text-slate-800 hover:bg-slate-900/5 dark:text-slate-100 dark:hover:bg-white/10"
                        )}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/5 dark:bg-white/10">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        {l.label}
                      </a>
                    </motion.li>
                  );
                })}
              </ul>
              <div className="flex items-center gap-2 border-t border-slate-200/70 px-3 py-3 dark:border-white/10">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex h-12 flex-1 items-center justify-center rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 dark:border-white/15 dark:text-white"
                >
                  Sign in
                </Link>
                <NavThemeButton className="h-12 w-12 rounded-xl border border-slate-300 dark:border-white/15" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </nav>
    </header>
  );
}
