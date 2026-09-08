"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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
  MousePointerClick,
  Users,
  Repeat,
  Sparkles,
  PlusCircle,
  ArrowRight,
  BarChart3,
  Inbox,
} from "lucide-react";
import { formatNumber, formatPercentage, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to load dashboard metrics", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (isLoading) {
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
    deliveryRate: 0,
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Campaign Dashboard</h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time SMS delivery tracking, click attribution, and customer engagement intelligence.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/link-generator">
              <Button variant="outline" size="md">
                Link Generator
              </Button>
            </Link>
            <Link href="/campaigns/new">
              <Button variant="primary" size="md" className="gap-1.5 shadow-sm">
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
            subtitle={d.totalCampaigns > 0 ? "Active workspace" : "No campaigns yet"}
            icon={Send}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="SMS Sent"
            value={d.smsSent}
            subtitle={d.smsSent > 0 ? "Total volume" : "0 messages"}
            icon={Send}
            iconColor="text-slate-700"
            iconBg="bg-slate-100"
          />
          <StatCard
            title="Delivered"
            value={d.delivered}
            subtitle={`${d.deliveryRate}% rate`}
            icon={CheckCircle2}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
          <StatCard
            title="Total Clicks"
            value={d.totalClicks}
            subtitle={d.totalClicks > 0 ? "Attributed clicks" : "0 clicks"}
            icon={MousePointerClick}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
          />
          <StatCard
            title="Unique Clickers"
            value={d.uniqueClickers}
            subtitle={`${d.clickRate}% CTR`}
            icon={Users}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
          />
          <StatCard
            title="Repeat Clickers"
            value={d.repeatClickers}
            subtitle={d.repeatClickers > 0 ? "Multi-click users" : "0 users"}
            icon={Repeat}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
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
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Live Data</span>
              </div>
            </CardHeader>
            <CardContent>
              {clickTrend.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <BarChart3 className="w-8 h-8 text-slate-300 mb-2" />
                  <div className="text-xs font-semibold text-slate-700">No Click Interactions Recorded Yet</div>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                    When you send a campaign with a trackable short URL, recipient clicks will appear here in real-time.
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
              <Link href="/campaigns" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
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
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                        <Inbox className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                        <div className="text-xs font-medium text-slate-600">No campaigns launched yet</div>
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
                        <tr key={camp._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-3.5 font-medium text-slate-900">
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
                          <td className="px-4 py-3.5 text-purple-700 font-semibold">
                            {formatNumber(stats.totalClicks || 0)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                              {formatPercentage(ctr || 0)}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <Link href={`/click-analytics?campaignId=${camp._id}`}>
                              <span className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer">
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
              <div className="mt-5 p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                <span>Funnel Conversion</span>
                <span className="font-bold text-slate-900">
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
