"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Users,
  Sparkles,
  ArrowRight,
  Download,
  Filter,
  Search,
  CheckCircle2,
  TrendingUp,
  Target,
  Send,
} from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";

export default function ActiveLeadsPage() {
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadActiveLeads() {
      try {
        const res = await fetch(`/api/active-leads?segment=${segmentFilter}&search=${encodeURIComponent(search)}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to load active leads", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadActiveLeads();
  }, [segmentFilter, search]);

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
          <div className="h-48 bg-white border border-slate-200 rounded-xl p-6 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white border border-slate-200 rounded-xl p-4 animate-pulse" />
            ))}
          </div>
          <div className="h-72 bg-white border border-slate-200 rounded-xl p-6 animate-pulse" />
        </div>
      </AppLayout>
    );
  }

  const opt = data?.optimization || {
    totalAudience: 0,
    highlyActiveCount: 0,
    engagedCount: 0,
    lowEngagementCount: 0,
    volumeReductionPercent: 0,
  };

  const leads = data?.leads || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Active Leads & Intelligence</h1>
            <p className="text-xs text-slate-500 mt-1">
              Identify high-intent users based on repeated engagement across SMS campaigns.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/api/exports/leads" download>
              <Button variant="outline" size="md" className="gap-2">
                <Download className="w-4 h-4" />
                <span>Export Audience</span>
              </Button>
            </a>
            <Link href="/campaigns/new?source=retargeting&audience=highly_active">
              <Button variant="primary" size="md" className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm">
                <Sparkles className="w-4 h-4" />
                <span>Create Retargeting Campaign</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Smart Audience Rule Highlight Card */}
        <Card className="p-6 border-purple-200 bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="purple" className="bg-purple-500/30 text-purple-200 border-purple-400/40">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-300" />
                  Primary Smart Segment
                </Badge>
                <span className="text-xs text-slate-300">Updated Real-Time</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Highly Active SMS Users</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="px-2.5 py-1 bg-white/10 rounded-lg border border-white/10">
                  ✓ Clicked at least <strong>3 campaigns</strong>
                </span>
                <span className="px-2.5 py-1 bg-white/10 rounded-lg border border-white/10">
                  ✓ Clicked at least <strong>2 times</strong>
                </span>
                <span className="px-2.5 py-1 bg-white/10 rounded-lg border border-white/10">
                  ✓ Last click within <strong>30 days</strong>
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs text-center min-w-[200px]">
              <div className="text-xs uppercase tracking-wider text-purple-300 font-semibold">Matching Leads</div>
              <div className="text-3xl font-black text-white mt-1">{formatNumber(opt.highlyActiveCount)}</div>
              <div className="text-[11px] text-emerald-300 mt-0.5">High Intent Repeat Buyers</div>
            </div>
          </div>
        </Card>

        {/* 3 Audience Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            onClick={() => setSegmentFilter("highly_active")}
            className={`p-5 cursor-pointer transition-all hover:shadow-md ${
              segmentFilter === "highly_active" ? "border-purple-500 ring-2 ring-purple-500/20" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Highly Active</span>
              <Badge variant="purple">Tier 1</Badge>
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">{formatNumber(opt.highlyActiveCount)}</div>
            <p className="text-xs text-slate-500 mt-1">Multi-campaign repeat clickers with high conversion intent.</p>
          </Card>

          <Card
            onClick={() => setSegmentFilter("engaged")}
            className={`p-5 cursor-pointer transition-all hover:shadow-md ${
              segmentFilter === "engaged" ? "border-blue-500 ring-2 ring-blue-500/20" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Engaged</span>
              <Badge variant="default">Tier 2</Badge>
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">{formatNumber(opt.engagedCount)}</div>
            <p className="text-xs text-slate-500 mt-1">Clicked at least 1 campaign within 60 days.</p>
          </Card>

          <Card
            onClick={() => setSegmentFilter("low_engagement")}
            className={`p-5 cursor-pointer transition-all hover:shadow-md ${
              segmentFilter === "low_engagement" ? "border-slate-400 ring-2 ring-slate-400/20" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Engagement</span>
              <Badge variant="secondary">Tier 3</Badge>
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">{formatNumber(opt.lowEngagementCount)}</div>
            <p className="text-xs text-slate-500 mt-1">Recipients who haven't clicked recently. Exclude to save costs.</p>
          </Card>
        </div>

        {/* Budget Optimization Opportunity Card */}
        <Card className="p-6 bg-slate-900 text-white border-0 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                <span>Budget Optimization Opportunity</span>
              </div>
              <div className="text-sm text-slate-300 leading-relaxed">
                Your last 4 campaigns reached approx. <strong>5,000 users</strong> each. Repeatedly engaged users:{" "}
                <strong className="text-white">{formatNumber(opt.highlyActiveCount)}</strong>.
              </div>
              <div className="text-xs text-slate-400">
                Recommended next audience: <strong>{formatNumber(opt.highlyActiveCount)} users</strong> • Potential reduction in
                SMS volume: <strong className="text-emerald-400 font-bold">{opt.volumeReductionPercent}%</strong>
              </div>
            </div>

            <Link href="/campaigns/new?source=retargeting&audience=highly_active">
              <Button variant="primary" size="lg" className="bg-blue-500 hover:bg-blue-600 gap-2 whitespace-nowrap">
                <Send className="w-4 h-4" />
                <span>Create Retargeting Campaign</span>
              </Button>
            </Link>
          </div>
        </Card>

        {/* Main Leads Table */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Identified High-Intent Leads</CardTitle>
              <CardDescription>Customer profiles sorted by algorithmic engagement score</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search recipient phone, name..."
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
                  <th className="px-6 py-3.5">User ID</th>
                  <th className="px-4 py-3.5">Phone Number</th>
                  <th className="px-4 py-3.5">Customer Name</th>
                  <th className="px-4 py-3.5">Campaigns Clicked</th>
                  <th className="px-4 py-3.5">Total Clicks</th>
                  <th className="px-4 py-3.5">Last Click</th>
                  <th className="px-4 py-3.5">Engagement Score</th>
                  <th className="px-4 py-3.5">Segment</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                      No active high-intent leads identified yet. Once campaigns are clicked multiple times, repeat buyers will automatically appear here.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead: any, idx: number) => (
                  <tr key={lead._id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900">{lead.userId}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">{lead.phone}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-900">{lead.recipientName}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{lead.campaignsClicked} campaigns</td>
                    <td className="px-4 py-3.5 font-bold text-purple-700">{lead.totalClicks} clicks</td>
                    <td className="px-4 py-3.5 text-slate-400 text-[11px]">{formatDate(lead.lastClickAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{lead.engagementScore}</span>
                        <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${lead.engagementScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={lead.segmentName === "Highly Active" ? "purple" : "default"}>
                        {lead.segmentName}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link href={`/campaigns/new?source=retargeting&recipient=${lead.phone}`}>
                        <span className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer">
                          Retarget
                        </span>
                      </Link>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
