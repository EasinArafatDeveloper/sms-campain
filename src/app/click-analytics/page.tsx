"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Layers,
  ChevronDown,
  X,
  FileSpreadsheet,
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCampaignId = searchParams.get("campaignId") || "all";

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>(initialCampaignId);
  const [data, setData] = useState<any>(null);
  const [attributions, setAttributions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Sync state if URL query param changes
  useEffect(() => {
    const fromUrl = searchParams.get("campaignId") || "all";
    if (fromUrl !== selectedCampaign) {
      setSelectedCampaign(fromUrl);
    }
  }, [searchParams]);

  // Load list of all campaigns for dropdown
  useEffect(() => {
    async function loadCampaignsList() {
      try {
        const res = await fetch("/api/campaigns?limit=100");
        const json = await res.json();
        const list = json.data || [];
        setCampaigns(list);
      } catch (err) {
        console.error("Failed to load campaigns list for analytics filter", err);
      }
    }
    loadCampaignsList();
  }, []);

  // Load analytics & attributions whenever selected campaign or search query changes
  useEffect(() => {
    async function loadAnalytics() {
      try {
        setIsLoading(true);
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

  const handleCampaignChange = (campaignId: string) => {
    setSelectedCampaign(campaignId);
    if (campaignId === "all") {
      router.replace("/click-analytics");
    } else {
      router.replace(`/click-analytics?campaignId=${campaignId}`);
    }
  };

  const currentCampaignObj = campaigns.find((c) => c._id === selectedCampaign);

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
        {/* Header with Campaign Dropdown Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Click Analytics & Attribution</h1>
            <p className="text-xs text-slate-500 mt-1">
              Recipient-level click telemetry, engagement attribution, and conversion funnel analysis.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Campaign Selector Dropdown */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-2xs">
              <Layers className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Campaign</span>
                <select
                  value={selectedCampaign}
                  onChange={(e) => handleCampaignChange(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-4"
                >
                  <option value="all">🌟 All Campaigns (Global Overview)</option>
                  {campaigns.map((camp) => (
                    <option key={camp._id} value={camp._id}>
                      {camp.name} ({camp.recipientCount || 0} SMS) - {camp.status}
                    </option>
                  ))}
                </select>
              </div>
              {selectedCampaign !== "all" && (
                <button
                  type="button"
                  onClick={() => handleCampaignChange("all")}
                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-100 transition-colors ml-1"
                  title="Reset to All Campaigns"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <a
              href={
                selectedCampaign !== "all"
                  ? `/api/exports/campaigns/${selectedCampaign}`
                  : "/api/exports/campaigns"
              }
              download
            >
              <Button variant="outline" size="md" className="gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export CSV</span>
              </Button>
            </a>
          </div>
        </div>

        {/* Selected Campaign Indicator Banner */}
        {selectedCampaign !== "all" && currentCampaignObj && (
          <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs flex items-center justify-between text-blue-900">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Filtered by Campaign:</span>
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold font-mono text-[11px]">
                {currentCampaignObj.name}
              </span>
              <span className="text-blue-600 text-[11px]">
                (Sender ID: {currentCampaignObj.senderId} • {currentCampaignObj.recipientCount || 0} contacts)
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCampaignChange("all")}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline cursor-pointer"
            >
              View All Campaigns
            </button>
          </div>
        )}

        {/* 7 KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard title="SMS Sent" value={formatNumber(metrics.smsSent)} icon={Send} iconBg="bg-slate-100" iconColor="text-slate-700" />
          <StatCard title="Delivered" value={formatNumber(metrics.delivered)} icon={CheckCircle2} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <StatCard title="Total Clicks" value={formatNumber(metrics.totalClicks)} icon={MousePointerClick} iconBg="bg-purple-50" iconColor="text-purple-600" />
          <StatCard title="Unique Clickers" value={formatNumber(metrics.uniqueClickers)} icon={Users} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
          <StatCard title="Click Rate" value={`${metrics.clickRate}%`} icon={Percent} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <StatCard title="Repeat Clickers" value={formatNumber(metrics.repeatClickers)} icon={Repeat} iconBg="bg-purple-50" iconColor="text-purple-700" />
          <StatCard title="High Intent" value={formatNumber(metrics.highIntentLeads)} icon={Sparkles} iconBg="bg-emerald-50" iconColor="text-emerald-700" />
        </div>

        {/* Funnel + Engagement Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Click Trend Analysis</CardTitle>
                <CardDescription>
                  {selectedCampaign !== "all"
                    ? `Daily link click volume breakdown for ${currentCampaignObj?.name || "selected campaign"}`
                    : "Daily link click volume breakdown across all campaigns"}
                </CardDescription>
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
                      No click interactions recorded for this selection.
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

