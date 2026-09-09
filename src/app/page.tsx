"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  MousePointerClick,
  BarChart3,
  Users,
  Send,
  Repeat,
  Lock,
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
import { formatNumber } from "@/lib/utils";

export default function LandingPage() {
  // Calculator state
  const [smsVolume, setSmsVolume] = useState<number>(25000);
  const [avgOrderValue, setAvgOrderValue] = useState<number>(1200);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [isYearly, setIsYearly] = useState<boolean>(false);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-purple-600/10 blur-[130px] rounded-full" />
        <div className="absolute top-[40%] right-[-10%] w-[600px] h-[500px] bg-blue-600/10 blur-[140px] rounded-full" />
        <div className="absolute top-[70%] left-[-10%] w-[600px] h-[500px] bg-purple-600/10 blur-[140px] rounded-full" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-white fill-white/20" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-white text-lg flex items-center gap-1.5">
                SMSPro <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">SaaS</span>
              </span>
              <span className="text-[10px] text-slate-400 -mt-1 tracking-wide">Customer Engagement</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#calculator" className="hover:text-white transition-colors">ROI Calculator</a>
            <a href="#gateways" className="hover:text-white transition-colors">Gateways</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/25 text-xs gap-1.5 font-semibold">
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs text-slate-300 shadow-xl backdrop-blur-md hover:border-blue-500/50 transition-colors">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="font-semibold text-white">Next-Gen Trackable SMS Engine</span>
              <span className="text-slate-500">|</span>
              <span className="text-blue-400 flex items-center gap-1 font-medium">
                Live BulkSMSBD & Multi-Gateway <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center max-w-4xl mx-auto space-y-5">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
              Turn Every Bulk SMS into <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Trackable High-Intent
              </span>{" "}
              Customer Actions
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Stop sending blind SMS broadcasts. Automatically inject unique, collision-proof 6-digit cryptographic short links for every recipient, track real-time click telemetry, and retarget hot buyers with 1-click.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-xl shadow-blue-600/30 text-sm font-bold gap-2 text-white border-0">
                  <Rocket className="w-4 h-4" />
                  <span>Start 14-Day Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 py-3 border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-sm font-semibold gap-2">
                  <Play className="w-4 h-4 text-blue-400 fill-blue-400/20" />
                  <span>Explore Live Demo (1-Click)</span>
                </Button>
              </Link>
            </div>

            {/* Trust Proof Points */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>99.4% Delivery Success Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span>Zero Fake Bot Clicks Filter</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Bring Your Own Gateway (BYOG)</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Mockup: Dynamic Phone Simulator + Live Telemetry Feed */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl p-1 bg-gradient-to-b from-slate-700/60 via-slate-800/30 to-slate-900/10 shadow-2xl backdrop-blur-xl border border-slate-700/50">
            <div className="bg-slate-900/90 rounded-[14px] p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Interactive Phone Simulation Preview */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-[280px] bg-slate-950 rounded-[32px] p-3 border-4 border-slate-800 shadow-2xl relative">
                  {/* Phone Speaker Notch */}
                  <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />
                  </div>

                  {/* SMS Header */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                        88
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-200">8809648910379</div>
                        <div className="text-[9px] text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Verified Sender
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">1:48 AM</span>
                  </div>

                  {/* SMS Message Bubble */}
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-[11px] text-slate-200 space-y-2">
                      <p>
                        Special offer is live! Get 20% discount today. Click here:
                      </p>
                      <div className="p-2 rounded bg-blue-950/60 border border-blue-800/50 text-blue-300 font-mono text-[10px] break-all font-semibold flex items-center justify-between">
                        <span>https://sms-campain.vercel.app/t/646842</span>
                        <MousePointerClick className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
                      </div>
                    </div>

                    {/* Attribution Tag Pill */}
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-800/40 text-[10px] text-emerald-300 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="font-bold">Hot Buyer Intent</span>
                      </div>
                      <span className="font-mono text-white text-[9px] bg-emerald-800/50 px-1.5 py-0.5 rounded font-bold">3 Clicks</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Telemetry & Control Dashboard Preview */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Campaign Attribution Telemetry</span>
                  </div>
                  <Badge variant="success" className="text-[10px]">Real-time Active</Badge>
                </div>

                {/* 3 Live Stream Cards */}
                <div className="space-y-2.5 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-center justify-between hover:border-blue-500/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div>
                        <span className="text-slate-300 font-bold font-sans">0171****456</span>
                        <span className="text-slate-500 text-[10px] ml-2 font-mono">ID: #646842</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-purple-400 text-[11px] font-sans font-semibold">3 Clicks (High Intent)</span>
                      <span className="text-[10px] text-slate-500">2s ago</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-center justify-between hover:border-blue-500/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <div>
                        <span className="text-slate-300 font-bold font-sans">0182****890</span>
                        <span className="text-slate-500 text-[10px] ml-2 font-mono">ID: #974799</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-blue-400 text-[11px] font-sans font-semibold">1 Click (First Touch)</span>
                      <span className="text-[10px] text-slate-500">14s ago</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-center justify-between hover:border-blue-500/40 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-slate-500" />
                      <div>
                        <span className="text-slate-400 font-sans">Google Messages Bot</span>
                        <span className="text-slate-500 text-[10px] ml-2 font-mono">Preview Crawler</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-[11px] font-sans">Filtered (No Fake Count)</span>
                      <span className="text-[10px] text-slate-500">1m ago</span>
                    </div>
                  </div>
                </div>

                {/* Micro Stats Bar */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                    <div className="text-lg font-bold text-white font-sans">14.2%</div>
                    <div className="text-[10px] text-slate-400 font-sans">Avg Click Rate (CTR)</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                    <div className="text-lg font-bold text-emerald-400 font-sans">28.6%</div>
                    <div className="text-[10px] text-slate-400 font-sans">High Intent Ratio</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                    <div className="text-lg font-bold text-blue-400 font-sans">0.0ms</div>
                    <div className="text-[10px] text-slate-400 font-sans">Collision Retries</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Feature Showcase */}
      <section id="features" className="relative z-10 py-20 border-t border-slate-800/60 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <Badge variant="default" className="px-3 py-1 text-xs">Architectural Advantages</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Engineered for Highest ROI and Character Efficiency
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Everything you need to broadcast trackable SMS campaigns, identify hot leads, and maximize revenue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Cryptographic Short Links */}
            <Card className="bg-slate-900/60 border-slate-800 p-6 hover:border-blue-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Cryptographic Nano-Short URLs</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                6-digit numeric or alphanumeric links take minimal SMS characters, keeping your messages strictly within 1 single SMS cost segment.
              </p>
            </Card>

            {/* Feature 2: Bot & Preview Filtering */}
            <Card className="bg-slate-900/60 border-slate-800 p-6 hover:border-blue-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Smart Bot & Preview Filtering</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically ignores background crawlers from Google Messages, WhatsApp, and Applebot so your click telemetry reflects 100% human intent.
              </p>
            </Card>

            {/* Feature 3: High-Intent Lead Scoring */}
            <Card className="bg-slate-900/60 border-slate-800 p-6 hover:border-blue-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Smart Buyer Intent Scoring</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dynamically tags repeat clickers as "High-Intent Hot Leads" and enables 1-click VIP retargeting audiences for 3x higher purchase conversion.
              </p>
            </Card>

            {/* Feature 4: Bring Your Own Gateway (BYOG) */}
            <Card className="bg-slate-900/60 border-slate-800 p-6 hover:border-blue-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Direct SMS Gateway Control</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Plug in your own BulkSMSBD API Key, Greenweb token, or custom gateway in Settings. Test connection and check live balance directly.
              </p>
            </Card>

            {/* Feature 5: Bulk Audience Manager & CSV Upload */}
            <Card className="bg-slate-900/60 border-slate-800 p-6 hover:border-blue-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Instant CSV & Audience Drag-Drop</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload 10,000+ contacts instantly via CSV or Excel. Normalizes Bangladesh +880 numbers automatically and removes invalid formats.
              </p>
            </Card>

            {/* Feature 6: Enterprise Rate Limiting & Queue */}
            <Card className="bg-slate-900/60 border-slate-800 p-6 hover:border-blue-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Enterprise Delivery Queue</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Batch processing, exponential backoff retries on provider timeout, and live delivery status feed for transparent tracking.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive 3-Step "How It Works" Flow */}
      <section id="how-it-works" className="relative z-10 py-20 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <Badge variant="purple" className="px-3 py-1 text-xs">Simplicity in 3 Steps</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              From Contact List to Attributed Revenue in Minutes
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Our automated crypto-pipeline handles unique link injection, dispatching, and telemetry tracking seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto text-lg font-black">
                1
              </div>
              <h3 className="text-base font-bold text-white">1. Compose & Audience Upload</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Type your marketing message with <code className="text-blue-300 font-mono font-bold bg-blue-950/60 px-1 py-0.5 rounded">{"{TRACKABLE_LINK}"}</code> and upload your recipient list via CSV or audience segment.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto text-lg font-black">
                2
              </div>
              <h3 className="text-base font-bold text-white">2. Automatic Link Injection</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The engine generates unique 6-digit short links per recipient and dispatches via your configured BulkSMSBD gateway.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-lg font-black">
                3
              </div>
              <h3 className="text-base font-bold text-white">3. Live Telemetry & Retargeting</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Watch real-time clicks on your dashboard. Export verified high-intent buyer phone numbers or retarget them with follow-up SMS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive ROI & Engagement Calculator */}
      <section id="calculator" className="relative z-10 py-20 border-t border-slate-800/60 bg-gradient-to-b from-slate-950 via-slate-900/80 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <Badge variant="success" className="px-3 py-1 text-xs">Live Revenue Estimator</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Calculate Your Expected SMS ROI & Intent Leads
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              See the projected engagement and revenue increase by switching to trackable SMS marketing.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Sliders */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-300">Monthly SMS Broadcast Volume</span>
                    <span className="text-blue-400 font-mono font-bold text-sm">{formatNumber(smsVolume)} SMS</span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="200000"
                    step="5000"
                    value={smsVolume}
                    onChange={(e) => setSmsVolume(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>5K</span>
                    <span>50K</span>
                    <span>100K</span>
                    <span>200K+</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-300">Average Order Value (BDT)</span>
                    <span className="text-emerald-400 font-mono font-bold text-sm">৳{formatNumber(avgOrderValue)}</span>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="5000"
                    step="100"
                    value={avgOrderValue}
                    onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>৳300</span>
                    <span>৳2,000</span>
                    <span>৳5,000</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Estimated SMS Gateway Cost:</span>
                    <span className="font-mono text-slate-200">৳{formatNumber(smsCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Click-Through Rate:</span>
                    <span className="font-mono text-blue-400 font-bold">14.0%</span>
                  </div>
                </div>
              </div>

              {/* Calculated Results */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-800/40 text-center">
                  <MousePointerClick className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
                  <div className="text-xl font-black text-white font-mono">{formatNumber(estimatedTotalClicks)}</div>
                  <div className="text-[10px] text-slate-400 font-sans mt-0.5">Estimated Clicks</div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-900 border border-purple-800/40 text-center">
                  <Flame className="w-5 h-5 text-purple-400 mx-auto mb-1.5" />
                  <div className="text-xl font-black text-purple-300 font-mono">{formatNumber(estimatedHighIntentLeads)}</div>
                  <div className="text-[10px] text-slate-400 font-sans mt-0.5">Hot Buyer Leads</div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-800/40 text-center">
                  <DollarSign className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                  <div className="text-xl font-black text-emerald-300 font-mono">৳{formatNumber(estimatedRevenue)}</div>
                  <div className="text-[10px] text-slate-400 font-sans mt-0.5">Est. Retargeted Revenue</div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-800/40 text-center">
                  <Rocket className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
                  <div className="text-xl font-black text-amber-300 font-mono">{roiMultiplier}x</div>
                  <div className="text-[10px] text-slate-400 font-sans mt-0.5">Projected Campaign ROI</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported SMS Gateways Section */}
      <section id="gateways" className="relative z-10 py-16 border-t border-slate-800/60 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-10">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Multi-Gateway Integration Ecosystem</p>
            <h3 className="text-xl font-extrabold text-white">Plug In Your Existing SMS Accounts Seamlessly</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center gap-2 text-slate-200 font-bold text-xs hover:border-blue-500/40 transition-colors">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>BulkSMSBD (Live API)</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center gap-2 text-slate-200 font-bold text-xs hover:border-blue-500/40 transition-colors">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Greenweb Bangladesh</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center gap-2 text-slate-200 font-bold text-xs hover:border-blue-500/40 transition-colors">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span>Twilio Global SMS</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center gap-2 text-slate-200 font-bold text-xs hover:border-blue-500/40 transition-colors">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Custom REST API</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-20 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <Badge variant="default" className="px-3 py-1 text-xs">Transparent SaaS Plans</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Simple, Predictable Plans for Growing Brands
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              No hidden fees. Bring your own SMS gateway and pay only for platform features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <Card className="bg-slate-900/60 border-slate-800 p-8 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Starter Plan</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">৳1,490</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400">For small business owners starting trackable SMS marketing.</p>

                <ul className="space-y-2.5 pt-4 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Up to 25,000 Trackable Short Links/mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>BulkSMSBD Gateway Connection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Real-time Click Telemetry & CTR</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>CSV Contact Upload</span>
                  </li>
                </ul>
              </div>

              <Link href="/register" className="pt-6">
                <Button variant="outline" className="w-full text-xs font-bold border-slate-700 hover:bg-slate-800">
                  Start Starter Plan
                </Button>
              </Link>
            </Card>

            {/* Growth Plan (Popular) */}
            <Card className="bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-900 border-2 border-blue-500/80 p-8 flex flex-col justify-between shadow-2xl shadow-blue-500/10 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-md">
                Most Popular for E-Commerce
              </div>

              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-400">Growth Plan</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">৳3,490</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400">For fast-growing brands who want buyer intent scoring & retargeting.</p>

                <ul className="space-y-2.5 pt-4 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="font-semibold">Unlimited Trackable Short Links</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Smart Buyer Intent Lead Scoring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>1-Click Active Leads CSV Export</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Multi-Gateway Support & Test SMS</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
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
            <Card className="bg-slate-900/60 border-slate-800 p-8 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Enterprise Agency</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">৳8,990</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400">For marketing agencies & high-volume retail chains.</p>

                <ul className="space-y-2.5 pt-4 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Dedicated Custom Short Domain (`go.brand.com`)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Multi-User Team Role Permissions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Direct REST Webhooks & CRM Sync</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Priority 24/7 SLA Support</span>
                  </li>
                </ul>
              </div>

              <Link href="/register" className="pt-6">
                <Button variant="outline" className="w-full text-xs font-bold border-slate-700 hover:bg-slate-800">
                  Contact Enterprise Sales
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="relative z-10 py-20 border-t border-slate-800/60 bg-slate-950/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14">
            <Badge variant="default" className="px-3 py-1 text-xs">Frequently Asked Questions</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Everything You Need to Know
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-white hover:text-blue-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-blue-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/50 pt-3">
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
      <section className="relative z-10 py-20 border-t border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/50 to-purple-900/40 border border-blue-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Ready to 10x Your SMS Campaign Conversions?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
                Join top e-commerce stores and agencies driving measurable ROI with trackable SMS. Set up in less than 2 minutes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-100 text-slate-950 font-black text-sm shadow-xl gap-2 border-0">
                  <span>Start Your 14-Day Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 py-3.5 border-slate-600 bg-slate-900/60 text-slate-200 text-sm font-bold hover:bg-slate-800">
                  <span>Explore Demo Account</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950 py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              <Zap className="w-4 h-4" />
            </div>
            <span className="font-bold text-white">SMSPro SaaS</span>
            <span className="text-slate-500">© 2026 SMSPro Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-white transition-colors">Create Account</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Workspace</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
