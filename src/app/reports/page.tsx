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
  Trash2,
  AlertTriangle,
  Loader2,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { formatNumber, formatPercentage, formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const [reports, setReports] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Deletion state
  const [campaignToDelete, setCampaignToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  useEffect(() => {
    loadReports();
  }, []);

  async function handleDeleteConfirm() {
    if (!campaignToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignToDelete._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete campaign");
      }

      setReports((prev: any) => {
        if (!prev) return prev;
        const updated = prev.campaigns.filter((c: any) => c._id !== campaignToDelete._id);
        return {
          ...prev,
          overview: {
            ...prev.overview,
            totalCampaigns: updated.length,
          },
          campaigns: updated,
        };
      });

      setNotification({
        type: "success",
        message: `Campaign "${campaignToDelete.name}" and all related database records have been deleted successfully.`,
      });
      setCampaignToDelete(null);
    } catch (err: any) {
      console.error("Delete error:", err);
      setNotification({
        type: "error",
        message: err.message || "Failed to delete campaign",
      });
    } finally {
      setIsDeleting(false);
    }
  }

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
        {/* Notification Banner */}
        {notification && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center justify-between transition-all ${
              notification.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Campaign Performance Reports</h1>
            <p className="text-xs text-slate-500 mt-1">
              Historical delivery reliability, click attribution, and ROI metrics across all broadcasts.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <a href="/api/exports/campaigns" download>
              <Button variant="primary" size="md" className="gap-2 shadow-xs">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export All Campaigns CSV</span>
              </Button>
            </a>
            <a href="/api/exports/leads" download>
              <Button variant="outline" size="md" className="gap-2">
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export Active Leads CSV</span>
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
            subtitle="ZendSMS Gateway"
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
                  <th className="px-4 py-3.5">High Intent</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                      No campaign reports available yet. Once campaigns are sent, comprehensive performance summaries will appear here.
                    </td>
                  </tr>
                ) : (
                  data.campaigns.map((c: any) => (
                    <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        <div>{c.name}</div>
                        <div className="text-[10px] text-slate-400">Sender ID: <span className="font-mono text-slate-600">{c.senderId}</span></div>
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
                      <td className="px-4 py-4 font-bold text-emerald-600">
                        +{c.highIntent} leads
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/api/exports/campaigns/${c._id}`}
                            download
                            title="Download Full Campaign CSV Report"
                          >
                            <Button variant="secondary" size="sm" className="gap-1 text-xs text-emerald-700 hover:text-emerald-800">
                              <Download className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">CSV</span>
                            </Button>
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCampaignToDelete(c)}
                            className="text-xs text-red-600 hover:bg-red-50 hover:border-red-300 border-slate-200"
                            title="Delete Campaign and Cascade DB Cleanup"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Cascade Delete Confirmation Modal */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Delete Campaign Permanently?</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete <strong className="text-slate-800 font-semibold">{campaignToDelete.name}</strong>?
                </p>
              </div>
            </div>

            <div className="p-3 bg-red-50/70 border border-red-200/60 rounded-xl text-xs text-red-700 space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                <span>Database Cleanup Cascade Notice:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-red-600/90">
                <li>Campaign configuration and metrics</li>
                <li>All recipient records & queue delivery jobs</li>
                <li>Generated unique tracking links</li>
                <li>Historical click telemetry & engagement events</li>
              </ul>
              <p className="text-[11px] font-medium pt-1 text-red-800">
                This will permanently free up database storage and remove all associated records.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setCampaignToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="gap-2 bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting from DB...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete Campaign</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

