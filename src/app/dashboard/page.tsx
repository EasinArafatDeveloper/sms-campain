"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FunnelChart } from "@/components/ui/FunnelChart";
import { ClickTrendChart } from "@/components/dashboard/ClickTrendChart";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import {
  EngagementIntelligenceCard,
  CampaignOptimizationCard,
} from "@/components/dashboard/EngagementIntelligenceCard";
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MousePointerClick,
  Users,
  Repeat,
  PlusCircle,
  ArrowRight,
  BarChart3,
  Inbox,
  Calendar,
  RefreshCw,
  Coins,
  ShieldAlert,
} from "lucide-react";
import { formatNumber, formatPercentage, formatDate, cn } from "@/lib/utils";

type DateRange = "7d" | "30d" | "90d" | "all";

const RANGE_LABELS: Record<DateRange, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  all: "All Time",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDashboard = useCallback(
    async (range: DateRange, isManual = false) => {
      try {
        if (isManual) setIsRefreshing(true);
        else setIsLoading(true);

        const res = await fetch(`/api/dashboard?range=${range}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error("Failed to load dashboard metrics", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

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

  const d = data || {
    totalCampaigns: 0,
    smsSent: 0,
    delivered: 0,
    failed: 0,
    pendingRetry: 0,
    deliveryRate: 0,
    failedRate: 0,
    totalClicks: 0,
    uniqueClickers: 0,
    clickRate: 0,
    repeatClickers: 0,
    highIntentLeads: 0,
    potentialReductionPercent: 0,
    recentCampaigns: [],
    clickTrend: [],
    funnel: {
      sent: 0,
      delivered: 0,
      uniqueClickers: 0,
      repeatClickers: 0,
      highIntentLeads: 0,
    },
    leadDistribution: {
      highlyActive: 0,
      engaged: 0,
      lowEngagement: 0,
      total: 0,
    },
  };

  const funnelStages = [
    { label: "SMS Sent", count: d.funnel?.sent || 0, percent: 100, color: "#2563EB" },
    {
      label: "Delivered",
      count: d.funnel?.delivered || 0,
      percent: d.funnel?.sent > 0 ? Number(((d.funnel.delivered / d.funnel.sent) * 100).toFixed(1)) : 0,
      color: "#3B82F6",
    },
    {
      label: "Unique Clickers",
      count: d.funnel?.uniqueClickers || 0,
      percent: d.funnel?.delivered > 0 ? Number(((d.funnel.uniqueClickers / d.funnel.delivered) * 100).toFixed(1)) : 0,
      color: "#7C3AED",
    },
    {
      label: "Repeat Clickers",
      count: d.funnel?.repeatClickers || 0,
      percent: d.funnel?.uniqueClickers > 0 ? Number(((d.funnel.repeatClickers / d.funnel.uniqueClickers) * 100).toFixed(1)) : 0,
      color: "#8B5CF6",
    },
    {
      label: "High Intent",
      count: d.funnel?.highIntentLeads || 0,
      percent: d.funnel?.repeatClickers > 0 ? Number(((d.funnel.highIntentLeads / d.funnel.repeatClickers) * 100).toFixed(1)) : 0,
      color: "#10B981",
    },
  ];

  const recentCampaigns = d.recentCampaigns || [];
  const clickTrend = d.clickTrend || [];
  const smsCredits = user?.smsCredits ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Zero / Low SMS Credit Warning Banner */}
        {smsCredits <= 0 ? (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900 dark:text-rose-200 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm">Your SMS Credit Balance is 0</div>
                <div className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                  Campaigns will be blocked from sending until credits are refilled.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              {!user?.isPhoneVerified && (
                <Link
                  href="/profile"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors"
                >
                  Verify Phone (+50 Free Credits)
                </Link>
              )}
              <Link
                href={user?.platformRole === "superadmin" ? "/admin" : "/settings"}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors"
              >
                Top Up Balance
              </Link>
            </div>
          </div>
        ) : smsCredits < 10 ? (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-amber-900 dark:text-amber-200 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Coins className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="text-xs font-semibold">
                Low SMS Balance: You have only <strong>{smsCredits}</strong> credits remaining.
              </div>
            </div>
            <Link
              href={user?.platformRole === "superadmin" ? "/admin" : "/profile"}
              className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
            >
              Get More Credits →
            </Link>
          </div>
        ) : null}

        {/* Page Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Campaign Dashboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time SMS delivery tracking, click attribution, and customer engagement intelligence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Selector Buttons */}
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-2xs">
              {(["7d", "30d", "90d", "all"] as DateRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                    dateRange === r
                      ? "bg-blue-600 text-white shadow-2xs font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  {RANGE_LABELS[r]}
                </button>
              ))}
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={() => fetchDashboard(dateRange, true)}
              disabled={isRefreshing}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh live data"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-blue-600")} />
            </button>

            {/* Action Buttons */}
            <Link href="/link-generator">
              <Button variant="outline" size="md">
                Link Generator
              </Button>
            </Link>
            <Link href="/campaigns/new">
              <Button variant="primary" size="md" className="gap-1.5 shadow-xs">
                <PlusCircle className="w-4 h-4" />
                <span>Create SMS Campaign</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 6 Core KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Total Campaigns"
            value={d.totalCampaigns}
            subtitle={d.totalCampaigns > 0 ? "In selected range" : "No campaigns"}
            icon={Send}
            iconColor="text-blue-600 dark:text-blue-400"
            iconBg="bg-blue-50 dark:bg-blue-950/60"
          />
          <StatCard
            title="SMS Sent"
            value={d.smsSent}
            subtitle={d.smsSent > 0 ? "Dispatched volume" : "0 messages"}
            icon={Send}
            iconColor="text-slate-700 dark:text-slate-300"
            iconBg="bg-slate-100 dark:bg-slate-800"
          />
          <StatCard
            title="Delivered"
            value={d.delivered}
            subtitle={`${d.deliveryRate}% rate`}
            icon={CheckCircle2}
            iconColor="text-emerald-600 dark:text-emerald-400"
            iconBg="bg-emerald-50 dark:bg-emerald-950/60"
          />
          <StatCard
            title="Delivery Issues"
            value={d.failed + d.pendingRetry}
            subtitle={`${d.failed} failed • ${d.pendingRetry} retrying`}
            icon={AlertTriangle}
            iconColor={d.failed > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-500"}
            iconBg={d.failed > 0 ? "bg-rose-50 dark:bg-rose-950/60" : "bg-slate-100 dark:bg-slate-800"}
          />
          <StatCard
            title="Unique Clickers"
            value={d.uniqueClickers}
            subtitle={`${d.clickRate}% CTR`}
            icon={Users}
            iconColor="text-indigo-600 dark:text-indigo-400"
            iconBg="bg-indigo-50 dark:bg-indigo-950/60"
          />
          <StatCard
            title="Repeat Clickers"
            value={d.repeatClickers}
            subtitle={d.repeatClickers > 0 ? "High intent buyers" : "0 users"}
            icon={Repeat}
            iconColor="text-purple-600 dark:text-purple-400"
            iconBg="bg-purple-50 dark:bg-purple-950/60"
          />
        </div>

        {/* Main Analytics Grid: Click Engagement Over Time + Engagement Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Click Engagement Over Time</CardTitle>
                <CardDescription>Daily comparison of total click volume vs unique recipient clicks</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Data</span>
                <span className="text-[10px] text-slate-400">
                  • {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {clickTrend.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                  <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No Click Interactions Recorded ({RANGE_LABELS[dateRange]})
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                    When recipients click on trackable short URLs in campaigns sent during this period, real-time attribution appears here.
                  </p>
                </div>
              ) : (
                <ClickTrendChart data={clickTrend} />
              )}
            </CardContent>
          </Card>

          <EngagementIntelligenceCard
            highIntentCount={d.highIntentLeads || 0}
            uniqueClickers={d.uniqueClickers || 0}
            repeatClickers={d.repeatClickers || 0}
            dateRangeLabel={RANGE_LABELS[dateRange]}
          />
        </div>

        {/* Mid Grid: Recent Campaigns Performance + Engagement Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Performance Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Recent Campaign Performance</CardTitle>
                <CardDescription>Latest SMS broadcasts with link attribution metrics</CardDescription>
              </div>
              <Link href="/campaigns" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3">Campaign</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Sent</th>
                    <th className="px-4 py-3">Delivered</th>
                    <th className="px-4 py-3">Clicks</th>
                    <th className="px-4 py-3">CTR</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {recentCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                        <Inbox className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          No campaigns found in {RANGE_LABELS[dateRange]}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Create your first trackable SMS campaign to start broadcasting.
                        </p>
                        <Link href="/campaigns/new" className="mt-3 inline-block">
                          <Button variant="primary" size="sm" className="gap-1.5">
                            <PlusCircle className="w-3.5 h-3.5" />
                            Create First Campaign
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    recentCampaigns.map((camp: any) => {
                      const stats = camp.statistics || {};
                      const ctr = stats.delivered > 0 ? ((stats.uniqueClickers || 0) / stats.delivered) * 100 : 0;
                      return (
                        <tr key={camp._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">
                            <div>{camp.name}</div>
                            <div className="text-[10px] text-slate-400">
                              Sender: {camp.senderId} • {formatDate(camp.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={camp.status} />
                          </td>
                          <td className="px-4 py-3.5 font-medium">{formatNumber(stats.sent || 0)}</td>
                          <td className="px-4 py-3.5">{formatNumber(stats.delivered || 0)}</td>
                          <td className="px-4 py-3.5 text-purple-700 dark:text-purple-400 font-semibold">
                            {formatNumber(stats.totalClicks || 0)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-medium">
                              {formatPercentage(ctr || 0)}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <Link href={`/click-analytics?campaignId=${camp._id}`}>
                              <span className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer">
                                Analytics
                              </span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Engagement Funnel Card */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Engagement Funnel</CardTitle>
                <CardDescription>Conversion flow from sent to high-intent leads</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <FunnelChart stages={funnelStages} />
              <div className="mt-5 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <span>Funnel Conversion</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {d.funnel?.sent > 0 ? `${((d.funnel.highIntentLeads / d.funnel.sent) * 100).toFixed(1)}% High Intent` : "0%"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Optimization Opportunity Banner */}
        <CampaignOptimizationCard
          volumeReductionPercent={d.potentialReductionPercent || 0}
          highIntentCount={d.highIntentLeads || 0}
          totalAudience={d.leadDistribution?.total || 0}
        />
      </div>
    </AppLayout>
  );
}

