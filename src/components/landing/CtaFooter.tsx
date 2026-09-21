import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200/70 py-10 dark:border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:px-6">
        <div className="flex items-center gap-3">
          <Logo size={28} />
          <span>© {BRAND.year} {BRAND.name}. All rights reserved.</span>
        </div>
        <nav aria-label="Footer" className="flex items-center gap-6 font-medium">
          <a href="#features" className="hover:text-slate-900 dark:hover:text-white">Features</a>
          <Link href="/login" className="hover:text-slate-900 dark:hover:text-white">Sign in</Link>
          <Link href="/register" className="hover:text-slate-900 dark:hover:text-white">Create account</Link>
        </nav>
      </div>
    </footer>
  );
}
