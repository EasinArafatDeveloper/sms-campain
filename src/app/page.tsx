"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  MousePointerClick,
  Globe,
  Server,
  Check,
  ChevronDown,
  ChevronUp,
  Play,
  DollarSign,
  Smartphone,
  MessageSquare,
  Flame,
  Rocket,
  Star,
  Activity,
  Layers,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  Icon3DRocket,
  Icon3DLightning,
  Icon3DFlame,
  Icon3DShield,
  Icon3DCursor,
  Icon3DServer,
  Icon3DLock,
  Icon3DUsers,
  Icon3DChart,
  Icon3DSparkles,
} from "@/components/ui/Icons3D";
import { formatNumber } from "@/lib/utils";

export default function LandingPage() {
  // Calculator state
  const [smsVolume, setSmsVolume] = useState<number>(25000);
  const [avgOrderValue, setAvgOrderValue] = useState<number>(1200);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Calculated metrics
  const estimatedClickRate = 0.14; // 14% average CTR for personalized trackable SMS
  const estimatedTotalClicks = Math.round(smsVolume * estimatedClickRate);
  const highIntentRate = 0.28; // 28% of clickers click 2+ times
  const estimatedHighIntentLeads = Math.round(estimatedTotalClicks * highIntentRate);
  const conversionRate = 0.08; // 8% conversion on high-intent leads
  const estimatedRevenue = Math.round(estimatedHighIntentLeads * conversionRate * avgOrderValue);
  const smsCost = Math.round(smsVolume * 0.35); // 0.35 BDT per SMS avg
  const roiMultiplier = smsCost > 0 ? (estimatedRevenue / smsCost).toFixed(1) : "0";

  const faqs = [
    {
      q: "How does SMSPro save character limit and SMS cost?",
      a: "Standard URLs take 40-70 characters, pushing your message into 2 or 3 SMS segments. SMSPro generates collision-free 6-digit cryptographic nano-links (e.g. `domain.com/t/583214`), keeping your total SMS under 160 GSM-7 characters so you only pay for 1 single SMS.",
    },
    {
      q: "Can I connect my own BulkSMSBD, Greenweb, or Twilio account?",
      a: "Yes! SMSPro is built as a true multi-tenant SaaS. In your Settings dashboard, you can paste your own BulkSMSBD API Key and approved Sender ID, test live connection, check balance, and send messages through your direct gateway credentials.",
    },
    {
      q: "How does SMSPro prevent fake clicks from smartphone link previews?",
      a: "Modern smartphones (like Android Google Messages and Apple iMessage) automatically pre-fetch URLs in the background to build preview cards. SMSPro features an intelligent Bot & Preview Filter and a 2.5-second touch-debounce engine to filter out crawler hits and record 100% authentic human clicks.",
    },
    {
      q: "What makes a lead 'High-Intent'?",
      a: "Our attribution engine scores each recipient dynamically. Recipients who click multiple times or revisit within short windows are tagged as 'High Intent'. You can export these hot buyer phone numbers with 1-click or retarget them with VIP deals.",
    },
    {
      q: "Is my customer data secure and isolated?",
      a: "Absolutely. Every organization operates in strict cryptographic database isolation. Your contacts, tracking analytics, and API keys are protected and never shared or accessible across accounts.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white font-sans antialiased overflow-x-hidden transition-colors duration-300">
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-blue-500/20 via-indigo-500/20 to-purple-500/10 dark:from-blue-600/20 dark:via-indigo-600/20 dark:to-purple-600/10 blur-[130px] rounded-full" />
        <div className="absolute top-[40%] right-[-10%] w-[600px] h-[500px] bg-blue-500/10 dark:bg-blue-600/10 blur-[140px] rounded-full" />
        <div className="absolute top-[70%] left-[-10%] w-[600px] h-[500px] bg-purple-500/10 dark:bg-purple-600/10 blur-[140px] rounded-full" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 dark:bg-slate-950/75 border-b border-slate-200/80 dark:border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-all duration-300 border border-white/20">
              <Icon3DLightning size={24} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-lg flex items-center gap-1.5">
                SMSPro <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">SaaS</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 -mt-1 tracking-wide">Customer Engagement</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-white transition-colors">How It Works</a>
            <a href="#calculator" className="hover:text-blue-600 dark:hover:text-white transition-colors">ROI Calculator</a>
            <a href="#gateways" className="hover:text-blue-600 dark:hover:text-white transition-colors">Gateways</a>
            <a href="#pricing" className="hover:text-blue-600 dark:hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-blue-600 dark:hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 text-xs font-semibold">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/25 text-xs gap-1.5 font-bold text-white border-0 group">
                <Icon3DLightning size={16} className="group-hover:rotate-12 transition-transform" />
                <span>Start Free Trial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Pill Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 shadow-lg backdrop-blur-md hover:border-blue-500/50 transition-colors">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">Next-Gen Trackable SMS Engine</span>
              <span className="text-slate-400 dark:text-slate-600">|</span>
              <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1 font-semibold">
                Live BulkSMSBD & Multi-Gateway <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center max-w-4xl mx-auto space-y-5">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Turn Every Bulk SMS into <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400 bg-clip-text text-transparent">
                Trackable High-Intent
              </span>{" "}
              Customer Actions
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Stop sending blind SMS broadcasts. Automatically inject unique, collision-proof 6-digit cryptographic short links for every recipient, track real-time click telemetry, and retarget hot buyers with 1-click.
            </p>

            {/* CTAs with Rich 3D Icons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-xl shadow-blue-600/30 text-sm font-bold gap-3 text-white border-0 group">
                  <Icon3DRocket size={26} className="group-hover:scale-110 group-hover:rotate-6 transition-transform drop-shadow-md shrink-0" />
                  <span>Start 14-Day Free Trial</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 py-3.5 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold gap-2.5 shadow-sm">
                  <Play className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-blue-600/20" />
                  <span>Explore Live Demo (1-Click)</span>
                </Button>
              </Link>
            </div>

            {/* Trust Proof Points */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 dark:text-slate-400 font-semibold">
              <div className="flex items-center gap-2">
                <Icon3DShield size={20} />
                <span>99.4% Delivery Success Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon3DLightning size={20} />
                <span>Zero Fake Bot Clicks Filter</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon3DServer size={20} />
                <span>Bring Your Own Gateway (BYOG)</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Mockup: Dynamic Phone Simulator (Theme-Adaptive!) + Live Telemetry Feed */}
          <div className="mt-14 max-w-5xl mx-auto rounded-3xl p-1.5 bg-gradient-to-b from-blue-500/30 via-indigo-500/20 to-slate-200 dark:from-slate-700/60 dark:via-slate-800/30 dark:to-slate-900/10 shadow-2xl backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50">
            <div className="bg-white/95 dark:bg-slate-900/90 rounded-[22px] p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-lg transition-colors duration-300">
              
              {/* Left Column: Interactive Phone Simulation Preview (Theme-Adaptive: Silver Titanium in Light / Stealth Obsidian in Dark) */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-[290px] bg-gradient-to-b from-slate-200 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 rounded-[42px] p-3.5 border-[5px] border-slate-300 dark:border-slate-800 shadow-2xl relative text-slate-900 dark:text-white transition-all duration-300">
                  
                  {/* Phone Screen Inset Container */}
                  <div className="bg-white dark:bg-slate-950 rounded-[32px] p-3 border border-slate-200/90 dark:border-slate-800/80 shadow-inner">
                    {/* Dynamic Island / Speaker Notch */}
                    <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-2.5 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-slate-800 border border-slate-700 mr-2" />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
                    </div>

                    {/* Status Bar */}
                    <div className="flex justify-between items-center px-1 pb-2 text-[9px] font-bold text-slate-500 dark:text-slate-400 font-mono border-b border-slate-100 dark:border-slate-800/60">
                      <span>9:41 AM</span>
                      <div className="flex items-center gap-1">
                        <span>5G</span>
                        <span className="w-3.5 h-2 rounded-[2px] border border-slate-400 dark:border-slate-500 inline-block relative">
                          <span className="absolute inset-0.5 bg-emerald-500 rounded-[1px]" />
                        </span>
                      </div>
                    </div>

                    {/* SMS Header */}
                    <div className="flex items-center justify-between py-2 mb-2 px-0.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                          88
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100">8809648910379</div>
                          <div className="text-[9px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Verified Sender
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">1:48 AM</span>
                    </div>

                    {/* SMS Message Bubble */}
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-100/90 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-[11px] text-slate-800 dark:text-slate-200 space-y-2 shadow-xs transition-colors duration-300">
                        <p className="leading-relaxed">
                          Special offer is live! Get 20% discount today. Click here:
                        </p>
                        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-300 font-mono text-[10px] break-all font-bold flex items-center justify-between">
                          <span>https://sms-campain.vercel.app/t/646842</span>
                          <Icon3DCursor size={18} className="shrink-0 animate-bounce" />
                        </div>
                      </div>

                      {/* Attribution Tag Pill */}
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-gradient-to-r dark:from-emerald-950/70 dark:to-slate-900 border border-emerald-200 dark:border-emerald-800/40 text-[10px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-xs transition-colors duration-300">
                        <div className="flex items-center gap-1.5">
                          <Icon3DFlame size={18} />
                          <span className="font-bold">Hot Buyer Intent</span>
                        </div>
                        <span className="font-mono text-white text-[9px] bg-emerald-600 dark:bg-emerald-700 px-2 py-0.5 rounded-md font-bold shadow-xs">3 Clicks</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column: Live Telemetry & Control Dashboard Preview */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Live Campaign Attribution Telemetry</span>
                  </div>
                  <Badge variant="success" className="text-[10px] font-bold">Real-time Active</Badge>
                </div>

                {/* 3 Live Stream Cards */}
                <div className="space-y-2.5 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/90 flex items-center justify-between hover:border-blue-500/40 transition-colors shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                      <div>
                        <span className="text-slate-900 dark:text-slate-300 font-bold font-sans">0171****456</span>
                        <span className="text-slate-400 dark:text-slate-500 text-[10px] ml-2 font-mono">ID: #646842</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-purple-600 dark:text-purple-400 text-[11px] font-sans font-bold">3 Clicks (High Intent)</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">2s ago</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/90 flex items-center justify-between hover:border-blue-500/40 transition-colors shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                      <div>
                        <span className="text-slate-900 dark:text-slate-300 font-bold font-sans">0182****890</span>
                        <span className="text-slate-400 dark:text-slate-500 text-[10px] ml-2 font-mono">ID: #974799</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-blue-600 dark:text-blue-400 text-[11px] font-sans font-bold">1 Click (First Touch)</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">14s ago</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/90 flex items-center justify-between hover:border-blue-500/40 transition-colors shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <div>
                        <span className="text-slate-600 dark:text-slate-400 font-sans font-semibold">Google Messages Bot</span>
                        <span className="text-slate-400 dark:text-slate-500 text-[10px] ml-2 font-mono">Preview Crawler</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] font-sans">Filtered (No Fake Count)</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">1m ago</span>
                    </div>
                  </div>
                </div>

                {/* Micro Stats Bar */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
                    <div className="text-lg font-black text-slate-900 dark:text-white font-sans">14.2%</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-medium">Avg Click Rate (CTR)</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-sans">28.6%</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-medium">High Intent Ratio</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
                    <div className="text-lg font-black text-blue-600 dark:text-blue-400 font-sans">0.0ms</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-medium">Collision Retries</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Feature Showcase with 3D Icons */}
      <section id="features" className="relative z-10 py-20 border-t border-slate-200/80 dark:border-slate-800/60 bg-white/40 dark:bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <Badge variant="default" className="px-3.5 py-1 text-xs font-bold">Architectural Advantages</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Engineered for Highest ROI and Character Efficiency
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Everything you need to broadcast trackable SMS campaigns, identify hot leads, and maximize revenue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Cryptographic Short Links */}
            <Card className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 p-6 hover:border-blue-500/50 transition-all shadow-md group hover:shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <Icon3DLock size={32} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Cryptographic Nano-Short URLs</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                6-digit numeric or alphanumeric links take minimal SMS characters, keeping your messages strictly within 1 single SMS cost segment.
              </p>
            </Card>

            {/* Feature 2: Bot & Preview Filtering */}
            <Card className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 p-6 hover:border-blue-500/50 transition-all shadow-md group hover:shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <Icon3DShield size={32} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Smart Bot & Preview Filtering</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Automatically ignores background crawlers from Google Messages, WhatsApp, and Applebot so your click telemetry reflects 100% human intent.
              </p>
            </Card>

            {/* Feature 3: High-Intent Lead Scoring */}
            <Card className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 p-6 hover:border-blue-500/50 transition-all shadow-md group hover:shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <Icon3DFlame size={32} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Smart Buyer Intent Scoring</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Dynamically tags repeat clickers as "High-Intent Hot Leads" and enables 1-click VIP retargeting audiences for 3x higher purchase conversion.
              </p>
            </Card>

            {/* Feature 4: Bring Your Own Gateway (BYOG) */}
            <Card className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 p-6 hover:border-blue-500/50 transition-all shadow-md group hover:shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <Icon3DServer size={32} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Direct SMS Gateway Control</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Plug in your own BulkSMSBD API Key, Greenweb token, or custom gateway in Settings. Test connection and check live balance directly.
              </p>
            </Card>

            {/* Feature 5: Bulk Audience Manager & CSV Upload */}
            <Card className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 p-6 hover:border-blue-500/50 transition-all shadow-md group hover:shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <Icon3DUsers size={32} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Instant CSV & Audience Drag-Drop</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Upload 10,000+ contacts instantly via CSV or Excel. Normalizes Bangladesh +880 numbers automatically and removes invalid formats.
              </p>
            </Card>

            {/* Feature 6: Enterprise Rate Limiting & Queue */}
            <Card className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 p-6 hover:border-blue-500/50 transition-all shadow-md group hover:shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <Icon3DLightning size={32} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Enterprise Delivery Queue</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Batch processing, exponential backoff retries on provider timeout, and live delivery status feed for transparent tracking.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive 3-Step "How It Works" Flow */}
      <section id="how-it-works" className="relative z-10 py-20 border-t border-slate-200/80 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <Badge variant="purple" className="px-3.5 py-1 text-xs font-bold">Simplicity in 3 Steps</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              From Contact List to Attributed Revenue in Minutes
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Our automated crypto-pipeline handles unique link injection, dispatching, and telemetry tracking seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-center space-y-4 relative shadow-md hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto text-xl font-black shadow-lg shadow-blue-500/30">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">1. Compose & Audience Upload</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Type your marketing message with <code className="text-blue-600 dark:text-blue-300 font-mono font-bold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/50">{"{TRACKABLE_LINK}"}</code> and upload your recipient list via CSV or audience segment.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-center space-y-4 relative shadow-md hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto text-xl font-black shadow-lg shadow-indigo-500/30">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">2. Automatic Link Injection</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                The engine generates unique 6-digit short links per recipient and dispatches via your configured BulkSMSBD gateway.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-center space-y-4 relative shadow-md hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto text-xl font-black shadow-lg shadow-emerald-500/30">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">3. Live Telemetry & Retargeting</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Watch real-time clicks on your dashboard. Export verified high-intent buyer phone numbers or retarget them with follow-up SMS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive ROI & Engagement Calculator */}
      <section id="calculator" className="relative z-10 py-20 border-t border-slate-200/80 dark:border-slate-800/60 bg-gradient-to-b from-slate-100/60 via-slate-50 to-slate-100/60 dark:from-slate-950 dark:via-slate-900/80 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <Badge variant="success" className="px-3.5 py-1 text-xs font-bold">Live Revenue Estimator</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Calculate Your Expected SMS ROI & Intent Leads
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              See the projected engagement and revenue increase by switching to trackable SMS marketing.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Sliders */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-700 dark:text-slate-300">Monthly SMS Broadcast Volume</span>
                    <span className="text-blue-600 dark:text-blue-400 font-mono font-bold text-sm">{formatNumber(smsVolume)} SMS</span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="200000"
                    step="5000"
                    value={smsVolume}
                    onChange={(e) => setSmsVolume(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                    <span>5K</span>
                    <span>50K</span>
                    <span>100K</span>
                    <span>200K+</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-700 dark:text-slate-300">Average Order Value (BDT)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm">৳{formatNumber(avgOrderValue)}</span>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="5000"
                    step="100"
                    value={avgOrderValue}
                    onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                    <span>৳300</span>
                    <span>৳2,000</span>
                    <span>৳5,000</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Estimated SMS Gateway Cost:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-200">৳{formatNumber(smsCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Click-Through Rate:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">14.0%</span>
                  </div>
                </div>
              </div>

              {/* Calculated Results with 3D Icons */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-slate-900 border border-blue-200 dark:border-blue-800/40 text-center shadow-sm">
                  <Icon3DCursor size={28} className="mx-auto mb-1.5" />
                  <div className="text-xl font-black text-slate-900 dark:text-white font-mono">{formatNumber(estimatedTotalClicks)}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans mt-0.5 font-medium">Estimated Clicks</div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-slate-900 border border-purple-200 dark:border-purple-800/40 text-center shadow-sm">
                  <Icon3DFlame size={28} className="mx-auto mb-1.5" />
                  <div className="text-xl font-black text-purple-700 dark:text-purple-300 font-mono">{formatNumber(estimatedHighIntentLeads)}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans mt-0.5 font-medium">Hot Buyer Leads</div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-200 dark:border-emerald-800/40 text-center shadow-sm">
                  <Icon3DLightning size={28} className="mx-auto mb-1.5" />
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono">৳{formatNumber(estimatedRevenue)}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans mt-0.5 font-medium">Est. Retargeted Revenue</div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-slate-900 border border-amber-200 dark:border-amber-800/40 text-center shadow-sm">
                  <Icon3DRocket size={28} className="mx-auto mb-1.5" />
                  <div className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono">{roiMultiplier}x</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans mt-0.5 font-medium">Projected Campaign ROI</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported SMS Gateways Section */}
      <section id="gateways" className="relative z-10 py-16 border-t border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-10">
            <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">Multi-Gateway Integration Ecosystem</p>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Plug In Your Existing SMS Accounts Seamlessly</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-3 text-slate-800 dark:text-slate-200 font-bold text-xs hover:border-blue-500/40 transition-all shadow-sm">
              <Icon3DServer size={24} />
              <span>BulkSMSBD (Live API)</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-3 text-slate-800 dark:text-slate-200 font-bold text-xs hover:border-blue-500/40 transition-all shadow-sm">
              <Icon3DShield size={24} />
              <span>Greenweb BD</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-3 text-slate-800 dark:text-slate-200 font-bold text-xs hover:border-blue-500/40 transition-all shadow-sm">
              <Icon3DUsers size={24} />
              <span>Twilio Global SMS</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-3 text-slate-800 dark:text-slate-200 font-bold text-xs hover:border-blue-500/40 transition-all shadow-sm">
              <Icon3DLightning size={24} />
              <span>Custom REST API</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-20 border-t border-slate-200/80 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <Badge variant="default" className="px-3.5 py-1 text-xs font-bold">Transparent SaaS Plans</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Simple, Predictable Plans for Growing Brands
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              No hidden fees. Bring your own SMS gateway and pay only for platform features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <Card className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 p-8 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-md">
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Starter Plan</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">৳1,490</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">For small business owners starting trackable SMS marketing.</p>

                <ul className="space-y-2.5 pt-4 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Up to 25,000 Trackable Short Links/mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>BulkSMSBD Gateway Connection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Real-time Click Telemetry & CTR</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>CSV Contact Upload</span>
                  </li>
                </ul>
              </div>

              <Link href="/register" className="pt-6">
                <Button variant="outline" className="w-full text-xs font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Start Starter Plan
                </Button>
              </Link>
            </Card>

            {/* Growth Plan (Popular) */}
            <Card className="bg-gradient-to-b from-blue-50/70 via-white to-white dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 border-2 border-blue-500/80 p-8 flex flex-col justify-between shadow-2xl shadow-blue-500/10 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold uppercase px-3.5 py-1 rounded-full shadow-md">
                Most Popular for E-Commerce
              </div>

              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Growth Plan</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">৳3,490</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">For fast-growing brands who want buyer intent scoring & retargeting.</p>

                <ul className="space-y-2.5 pt-4 text-xs text-slate-800 dark:text-slate-200 font-semibold">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Unlimited Trackable Short Links</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Smart Buyer Intent Lead Scoring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>1-Click Active Leads CSV Export</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Multi-Gateway Support & Test SMS</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Bot & Preview Filtering Engine</span>
                  </li>
                </ul>
              </div>

              <Link href="/register" className="pt-6">
                <Button variant="primary" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-blue-600/30">
                  Start 14-Day Free Trial
                </Button>
              </Link>
            </Card>

            {/* Enterprise Plan */}
            <Card className="bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 p-8 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-md">
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Enterprise Agency</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">৳8,990</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">For marketing agencies & high-volume retail chains.</p>

                <ul className="space-y-2.5 pt-4 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Dedicated Custom Short Domain (`go.brand.com`)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Multi-User Team Role Permissions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Direct REST Webhooks & CRM Sync</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Priority 24/7 SLA Support</span>
                  </li>
                </ul>
              </div>

              <Link href="/register" className="pt-6">
                <Button variant="outline" className="w-full text-xs font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Contact Enterprise Sales
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="relative z-10 py-20 border-t border-slate-200/80 dark:border-slate-800/60 bg-white/40 dark:bg-slate-950/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14">
            <Badge variant="default" className="px-3.5 py-1 text-xs font-bold">Frequently Asked Questions</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Everything You Need to Know
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 overflow-hidden transition-all shadow-xs"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* High-Converting CTA Banner */}
      <section className="relative z-10 py-20 border-t border-slate-200/80 dark:border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Ready to 10x Your SMS Campaign Conversions?
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto font-medium">
                Join top e-commerce stores and agencies driving measurable ROI with trackable SMS. Set up in less than 2 minutes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-100 text-slate-950 font-black text-sm shadow-xl gap-2.5 border-0 group">
                  <Icon3DRocket size={22} className="group-hover:scale-110 transition-transform" />
                  <span>Start Your 14-Day Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 py-3.5 border-white/40 bg-white/10 hover:bg-white/20 text-white text-sm font-bold backdrop-blur-sm">
                  <span>Explore Demo Account</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-12 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              <Icon3DLightning size={16} />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">SMSPro SaaS</span>
            <span className="text-slate-400 dark:text-slate-500">© 2026 SMSPro Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link href="/login" className="hover:text-blue-600 dark:hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-blue-600 dark:hover:text-white transition-colors">Create Account</Link>
            <Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-white transition-colors">Workspace</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
