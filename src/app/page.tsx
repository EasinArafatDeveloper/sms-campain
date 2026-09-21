import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { LandingNav } from "@/components/landing/LandingNav";
import { ScrollHero } from "@/components/landing/ScrollHero";
import { CapabilityStrip } from "@/components/landing/CapabilityStrip";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Estimator } from "@/components/landing/Estimator";
import { Pricing } from "@/components/landing/Pricing";
import { Faq } from "@/components/landing/Faq";
import { Cta, LandingFooter } from "@/components/landing/CtaFooter";

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name} — ${BRAND.tagline}` },
  description: BRAND.shortDescription,
};

export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      <a
        href="#main"
        className="sr-only z-[60] rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <LandingNav />
      <main id="main">
        <ScrollHero />
        <CapabilityStrip />
        <Features />
        <HowItWorks />
        <Estimator />
        <Pricing />
        <Faq />
        <Cta />
      </main>
      <LandingFooter />
    </div>
  );
}
