"use client";

import React, { useState, useEffect, Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { FunnelChart } from "@/components/ui/FunnelChart";
import { ClickTrendChart } from "@/components/dashboard/ClickTrendChart";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Send,
  CheckCircle2,
  MousePointerClick,
  Users,
  Percent,
  Repeat,
  Sparkles,
  Search,
  Filter,
  Download,
} from "lucide-react";
import { formatNumber, formatPercentage, formatDateTime } from "@/lib/utils";

export default function ClickAnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading click analytics...</div>}>
      <ClickAnalyticsContent />
    </Suspense>
  );
}

function ClickAnalyticsContent() {
  const [data, setData] = useState<any>(null);
  const [attributions, setAttributions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [resMetrics, resAttributions] = await Promise.all([
          fetch(`/api/analytics?campaignId=${selectedCampaign}`),
          fetch(`/api/analytics/attributions?campaignId=${selectedCampaign}&search=${encodeURIComponent(search)}`),
        ]);
        const jsonMetrics = await resMetrics.json();
        const jsonAttributions = await resAttributions.json();

        setData(jsonMetrics);
        setAttributions(jsonAttributions.data || []);
      } catch (err) {
        console.error("Failed to load click analytics", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, [selectedCampaign, search]);

  if (isLoading && !data) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-md" />
              <div className="h-4 w-96 bg-slate-200 animate-pulse rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-24 bg-white border border-slate-200 rounded-xl p-4 animate-pulse" />
            ))}
          </div>
          <div className="h-72 bg-white border border-slate-200 rounded-xl p-6 animate-pulse" />
        </div>
      </AppLayout>
    );
  }

  const metrics = data || {
    smsSent: 0,
    delivered: 0,
    totalClicks: 0,
    uniqueClickers: 0,
    clickRate: 0,
    repeatClickers: 0,
    highIntentLeads: 0,
    funnel: [
      { label: "SMS Sent", count: 0, percent: 100, color: "#2563EB" },
      { label: "Delivered", count: 0, percent: 0, color: "#3B82F6" },
      { label: "Unique Clickers", count: 0, percent: 0, color: "#7C3AED" },
      { label: "Repeat Clickers", count: 0, percent: 0, color: "#8B5CF6" },
      { label: "High Intent Leads", count: 0, percent: 0, color: "#10B981" },
    ],
    trend: [],
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Click Analytics & Attribution</h1>
            <p className="text-xs text-slate-500 mt-1">
              Recipient-level click telemetry, engagement attribution, and conversion funnel analysis.
            </p>
          </div>
          <a href="/api/exports/leads" download>
            <Button variant="outline" size="md" className="gap-2">
              <Download className="w-4 h-4" />
              <span>Export Attribution CSV</span>
            </Button>
          </a>
        </div>

        {/* 7 KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard title="SMS Sent" value={metrics.smsSent} icon={Send} iconBg="bg-slate-100" iconColor="text-slate-700" />
          <StatCard title="Delivered" value={metrics.delivered} icon={CheckCircle2} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <StatCard title="Total Clicks" value={metrics.totalClicks} icon={MousePointerClick} iconBg="bg-purple-50" iconColor="text-purple-600" />
          <StatCard title="Unique Clickers" value={metrics.uniqueClickers} icon={Users} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
          <StatCard title="Click Rate" value={`${metrics.clickRate}%`} icon={Percent} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <StatCard title="Repeat Clickers" value={metrics.repeatClickers} icon={Repeat} iconBg="bg-purple-50" iconColor="text-purple-700" />
          <StatCard title="High Intent" value={metrics.highIntentLeads} icon={Sparkles} iconBg="bg-emerald-50" iconColor="text-emerald-700" />
        </div>

        {/* Funnel + Engagement Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Click Trend Analysis</CardTitle>
                <CardDescription>Daily link click volume breakdown</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ClickTrendChart data={metrics.trend} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recipient Conversion Funnel</CardTitle>
                <CardDescription>From broadcast to high-intent leads</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <FunnelChart stages={metrics.funnel} />
            </CardContent>
          </Card>
        </div>

        {/* User-Level Click Attribution Table */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>User-Level Click Attribution</CardTitle>
              <CardDescription>Individual recipient interactions mapped by tracking ID and engagement score</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search phone, tracking ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">User ID</th>
                  <th className="px-4 py-3.5">Phone Number</th>
                  <th className="px-4 py-3.5">Campaign</th>
                  <th className="px-4 py-3.5">Tracking ID</th>
                  <th className="px-4 py-3.5">Clicks</th>
                  <th className="px-4 py-3.5">First Click</th>
                  <th className="px-4 py-3.5">Last Click</th>
                  <th className="px-4 py-3.5">Score</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attributions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-8 text-center text-slate-400">
                      No click interactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  attributions.map((attr, idx) => (
                    <tr key={attr._id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{attr.userId}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-600">{attr.phone}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-800">{attr.campaignName}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-mono font-bold border border-purple-100">
                          {attr.trackingId}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-purple-700">{attr.clicks}</td>
                      <td className="px-4 py-3.5 text-slate-400 text-[11px]">{formatDateTime(attr.firstClick)}</td>
                      <td className="px-4 py-3.5 text-slate-400 text-[11px]">{formatDateTime(attr.lastClick)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{attr.score}</span>
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${attr.score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Badge variant={attr.status === "High Intent" ? "success" : "default"}>
                          {attr.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
