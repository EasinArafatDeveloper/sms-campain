"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Send,
  CheckCircle2,
  MousePointerClick,
  Users,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { formatNumber, formatPercentage, formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const [reports, setReports] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await fetch("/api/reports");
        const json = await res.json();
        setReports(json);
      } catch (err) {
        console.error("Failed to load reports", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReports();
  }, []);

  if (isLoading && !reports) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-md" />
              <div className="h-4 w-96 bg-slate-200 animate-pulse rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white border border-slate-200 rounded-xl p-4 animate-pulse" />
            ))}
          </div>
          <div className="h-72 bg-white border border-slate-200 rounded-xl p-6 animate-pulse" />
        </div>
      </AppLayout>
    );
  }

  const data = reports || {
    overview: {
      totalCampaigns: 0,
      totalSent: 0,
      totalDelivered: 0,
      averageDeliveryRate: 0,
      totalClicks: 0,
      averageClickRate: 0,
      highIntentLeadsGenerated: 0,
      smsVolumeSaved: 0,
    },
    campaigns: [],
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Campaign Performance Reports</h1>
            <p className="text-xs text-slate-500 mt-1">
              Historical delivery reliability, click attribution, and ROI metrics across all broadcasts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/api/exports/leads" download>
              <Button variant="outline" size="md" className="gap-2">
                <Download className="w-4 h-4" />
                <span>Export Summary CSV</span>
              </Button>
            </a>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Messages Sent"
            value={data.overview.totalSent}
            subtitle={`${data.overview.totalCampaigns} Campaigns`}
            icon={Send}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Avg Delivery Rate"
            value={`${data.overview.averageDeliveryRate}%`}
            subtitle="BulkSMSBD Gateway"
            icon={CheckCircle2}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatCard
            title="Avg Click Rate (CTR)"
            value={`${data.overview.averageClickRate}%`}
            subtitle={`${formatNumber(data.overview.totalClicks)} Total Clicks`}
            icon={MousePointerClick}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
          <StatCard
            title="SMS Volume Saved"
            value={formatNumber(data.overview.smsVolumeSaved)}
            subtitle="Via Smart Retargeting"
            icon={Sparkles}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
          />
        </div>

        {/* Campaign Reports Table */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Detailed Campaign Aggregate Report</CardTitle>
              <CardDescription>Server-side aggregated metrics per broadcast campaign</CardDescription>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Campaign</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Sent</th>
                  <th className="px-4 py-3.5">Delivered</th>
                  <th className="px-4 py-3.5">Delivery %</th>
                  <th className="px-4 py-3.5">Total Clicks</th>
                  <th className="px-4 py-3.5">Unique Clickers</th>
                  <th className="px-4 py-3.5">CTR %</th>
                  <th className="px-6 py-3.5 text-right">High Intent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                      No campaign reports available yet. Once campaigns are sent, comprehensive performance summaries will appear here.
                    </td>
                  </tr>
                ) : (
                  data.campaigns.map((c: any) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div>{c.name}</div>
                      <div className="text-[10px] text-slate-400">Sender ID: {c.senderId}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-500">{formatDate(c.date)}</td>
                    <td className="px-4 py-4 font-medium">{formatNumber(c.sent)}</td>
                    <td className="px-4 py-4 text-emerald-700 font-medium">{formatNumber(c.delivered)}</td>
                    <td className="px-4 py-4 font-semibold">{c.deliveryRate}%</td>
                    <td className="px-4 py-4 text-purple-700 font-bold">{formatNumber(c.clicks)}</td>
                    <td className="px-4 py-4 font-medium">{formatNumber(c.uniqueClickers)}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                        {c.clickRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">
                      +{c.highIntent} leads
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
