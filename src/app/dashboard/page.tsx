"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/Badge";
import { ClickTrendChart } from "@/components/dashboard/ClickTrendChart";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { GettingStarted } from "@/components/dashboard/GettingStarted";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Coins,
  Flame,
  MousePointerClick,
  PlusCircle,
  RefreshCw,
  Send,
} from "lucide-react";
import { formatNumber, formatDate, cn } from "@/lib/utils";

type DateRange = "7d" | "30d" | "90d" | "all";

const RANGE_LABELS: Record<DateRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async (range: DateRange, isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      else setIsLoading(true);

      const res = await fetch(`/api/dashboard?range=${range}`);
      if (res.ok) {
        setData(await res.json());
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(dateRange);
  }, [fetchDashboard, dateRange]);

  if (isLoading && !data) {
    return (
      <AppLayout>
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  const d = data || {};
  const smsSent: number = d.smsSent || 0;
  const delivered: number = d.delivered || 0;
  const failed: number = d.failed || 0;
  const retrying: number = d.pendingRetry || 0;
  const uniqueClickers: number = d.uniqueClickers || 0;
  const totalClicks: number = d.totalClicks || 0;
  const deliveryRate: number = d.deliveryRate || 0;
  const clickRate: number = d.clickRate || 0;
  const hotLeads: number = d.highIntentLeads || 0;
  const recentCampaigns: any[] = d.recentCampaigns || [];
  const clickTrend: any[] = d.clickTrend || [];

  const smsCredits = user?.smsCredits ?? 0;
  const isSuper = user?.platformRole === "superadmin";
  const firstName = user?.name?.split(" ")[0];
  const attention = failed + retrying;
  const hasCampaigns = recentCampaigns.length > 0;

  const rise = (i: number) => ({
    initial: reduce ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] as const },
  });

  const results = [
    { label: "Sent", value: smsSent, pct: smsSent > 0 ? 100 : 0, note: "messages", bar: "from-blue-500 to-sky-400" },
    { label: "Delivered", value: delivered, pct: deliveryRate, note: "of sent", bar: "from-emerald-500 to-teal-400" },
    { label: "Clicked", value: uniqueClickers, pct: clickRate, note: "of delivered", bar: "from-indigo-500 to-violet-400" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Credit warning: only one, and only when it matters */}
        {smsCredits <= 0 ? (
          <motion.div
            {...rise(0)}
            role="status"
            className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/30 dark:bg-rose-500/10 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-rose-900 dark:text-rose-200">You are out of SMS credits</p>
                <p className="mt-0.5 text-xs text-rose-700 dark:text-rose-300">
                  {user && !user.isPhoneVerified
                    ? "Sending is paused. Verify your phone number to get 50 free credits."
                    : isSuper
                    ? "Sending is paused until credits are added to this workspace."
                    : "Sending is paused. Ask the Postman team to add credits to your workspace."}
                </p>
              </div>
            </div>
            {user && !user.isPhoneVerified ? (
              <Link href="/profile" className="inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-rose-700">
                Verify phone · +50 credits
              </Link>
            ) : isSuper ? (
              <Link href="/admin" className="inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-rose-700">
                Add credits
              </Link>
            ) : null}
          </motion.div>
        ) : smsCredits < 10 ? (
          <motion.div {...rise(0)} role="status" className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <span className="flex items-center gap-2.5">
              <Coins className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
              Only <strong>{smsCredits}</strong> credits left.
            </span>
            {user && !user.isPhoneVerified && (
              <Link href="/profile" className="shrink-0 font-semibold text-amber-800 hover:underline dark:text-amber-300">
                Verify phone for +50
              </Link>
            )}
          </motion.div>
        ) : null}

        {/* Header */}
        <motion.div {...rise(1)} className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {greeting()}
              {firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Here is how your campaigns are doing.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div role="tablist" aria-label="Date range" className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-slate-900">
              {(Object.keys(RANGE_LABELS) as DateRange[]).map((r) => {
                const active = dateRange === r;
                return (
                  <button
                    key={r}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setDateRange(r)}
                    className={cn(
                      "relative rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                      active ? "text-white" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    )}
                  >
                    {active && (
                      <motion.span layoutId="range-pill" className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md shadow-indigo-600/25" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                    )}
                    <span className="relative">{RANGE_LABELS[r]}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => fetchDashboard(dateRange, true)}
              disabled={isRefreshing}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white"
              aria-label="Refresh"
              title={lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Refresh"}
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin text-indigo-600")} />
            </button>

            <Link
              href="/campaigns/new"
              className="group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97]"
            >
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent motion-safe:animate-shimmer" />
              <PlusCircle className="relative h-4 w-4" aria-hidden="true" />
              <span className="relative">New campaign</span>
            </Link>
          </div>
        </motion.div>

        {/* Four numbers that matter */}
        <motion.div {...rise(2)} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="SMS credits"
            value={smsCredits}
            tone={smsCredits <= 0 ? "rose" : smsCredits < 10 ? "amber" : "indigo"}
            icon={Coins}
            sub={smsCredits <= 0 ? "Sending is paused" : "1 credit = 1 SMS"}
            href="/profile"
          />
          <KpiCard
            label="Messages sent"
            value={smsSent}
            tone="blue"
            icon={Send}
            sub={smsSent > 0 ? `${formatNumber(delivered)} delivered · ${deliveryRate}%` : "Nothing sent in this period"}
            href="/campaigns"
          />
          <KpiCard
            label="People who clicked"
            value={uniqueClickers}
            tone="emerald"
            icon={MousePointerClick}
            sub={smsSent > 0 ? `${clickRate}% click rate · ${formatNumber(totalClicks)} total clicks` : "Clicks appear after you send"}
            href="/click-analytics"
          />
          <KpiCard
            label="Needs attention"
            value={attention}
            tone={attention > 0 ? (failed > 0 ? "rose" : "amber") : "emerald"}
            icon={attention > 0 ? AlertTriangle : CheckCircle2}
            sub={attention > 0 ? `${formatNumber(failed)} failed · ${formatNumber(retrying)} retrying` : "No failed or retrying messages"}
            href="/delivery-queue"
          />
        </motion.div>

        {!hasCampaigns ? (
          <motion.div {...rise(3)}>
            <GettingStarted phoneVerified={!!user?.isPhoneVerified} isAllTime={dateRange === "all"} onShowAllTime={() => setDateRange("all")} />
          </motion.div>
        ) : (
          <>
            {/* Chart + results */}
            <motion.div {...rise(3)} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 lg:col-span-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Clicks over time</h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Total clicks and people who clicked · {RANGE_LABELS[dateRange]}</p>
                  </div>
                  {lastUpdated && (
                    <span className="shrink-0 text-[11px] text-slate-400">
                      Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  {clickTrend.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center dark:border-white/10 dark:bg-white/[0.02]">
                      <BarChart3 className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" aria-hidden="true" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No clicks in this period yet</p>
                      <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">Clicks on your campaign links show up here as they happen.</p>
                    </div>
                  ) : (
                    <ClickTrendChart data={clickTrend} />
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
                  <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Results</h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">From sent to clicked</p>
                  <div className="mt-5 space-y-4">
                    {results.map((r, i) => (
                      <div key={r.label}>
                        <div className="flex items-baseline justify-between text-sm">
                          <span className="font-medium text-slate-700 dark:text-slate-200">{r.label}</span>
                          <span className="tabular-nums text-slate-900 dark:text-white">
                            <strong className="font-bold">{formatNumber(r.value)}</strong>
                            {i > 0 && <span className="ml-1.5 text-xs text-slate-400">{r.pct}% {r.note}</span>}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                          <motion.div
                            className={cn("h-full origin-left rounded-full bg-gradient-to-r", r.bar)}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: Math.min(100, r.pct) / 100 }}
                            transition={{ duration: 0.8, delay: 0.1 * i, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-lg shadow-amber-500/20">
                  <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
                  <div className="relative flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-50">Hot leads</p>
                      <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">{formatNumber(hotLeads)}</p>
                    </div>
                    <Flame className="h-8 w-8 text-white/90" aria-hidden="true" />
                  </div>
                  <p className="relative mt-2 text-xs leading-relaxed text-amber-50">
                    {hotLeads > 0 ? "People who clicked in several campaigns. Good ones to follow up with." : "Appear when a contact clicks links in 3 different campaigns."}
                  </p>
                  <Link href="/active-leads" className="relative mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/95 px-3.5 text-xs font-semibold text-amber-700 transition-transform hover:-translate-y-0.5 active:scale-[0.97]">
                    View leads <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Recent campaigns */}
            <motion.div {...rise(4)} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Recent campaigns</h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{formatNumber(d.totalCampaigns || 0)} in this period</p>
                </div>
                <Link href="/campaigns" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300">
                  View all <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[440px] text-left text-sm">
                  <thead className="border-y border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-3">Campaign</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Sent</th>
                      <th className="hidden px-4 py-3 text-right lg:table-cell">Delivered</th>
                      <th className="px-4 py-3 text-right">Clicks</th>
                      <th className="px-6 py-3 text-right">Click rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                    {recentCampaigns.map((camp: any) => {
                      const s = camp.statistics || {};
                      const ctr = s.delivered > 0 ? ((s.uniqueClickers || 0) / s.delivered) * 100 : 0;
                      return (
                        <tr key={camp._id} className="group transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                          <td className="px-6 py-3.5">
                            <Link href={`/click-analytics?campaignId=${camp._id}`} className="block focus-visible:outline-none">
                              <span className="font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300">{camp.name}</span>
                              <span className="mt-0.5 block text-xs text-slate-400">
                                {camp.senderId} · {formatDate(camp.createdAt)}
                              </span>
                            </Link>
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={camp.status} />
                          </td>
                          <td className="px-4 py-3.5 text-right font-medium tabular-nums text-slate-700 dark:text-slate-200">{formatNumber(s.sent || 0)}</td>
                          <td className="hidden px-4 py-3.5 text-right tabular-nums text-slate-600 dark:text-slate-300 lg:table-cell">{formatNumber(s.delivered || 0)}</td>
                          <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-indigo-700 dark:text-indigo-300">{formatNumber(s.totalClicks || 0)}</td>
                          <td className="px-6 py-3.5">
                            <div className="ml-auto flex w-24 items-center justify-end gap-2">
                              <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">{ctr.toFixed(1)}%</span>
                              <span className="h-1.5 w-10 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                                <span className="block h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${Math.min(100, ctr * 3)}%` }} />
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
