"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import {
  PlusCircle,
  Search,
  Filter,
  BarChart3,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { formatNumber, formatPercentage, formatDate } from "@/lib/utils";
import { TablePageSkeleton } from "@/components/ui/Skeleton";

export default function CampaignsListPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Deletion state
  const [campaignToDelete, setCampaignToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function loadCampaigns() {
    try {
      const res = await fetch(`/api/campaigns?search=${encodeURIComponent(search)}&status=${statusFilter}`);
      const data = await res.json();
      setCampaigns(data.data || []);
    } catch (err) {
      console.error("Failed to load campaigns", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, [search, statusFilter]);

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

      setCampaigns((prev) => prev.filter((c) => c._id !== campaignToDelete._id));
      setNotification({
        type: "success",
        message: `Campaign "${campaignToDelete.name}" and all associated queue jobs, tracking links, and click logs have been permanently deleted from database.`,
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

  if (isLoading) {
    return (
      <AppLayout>
        <TablePageSkeleton titleWidth="w-72" rowCount={6} />
      </AppLayout>
    );
  }

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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">SMS Marketing Campaigns</h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage broadcast campaigns, export full detailed delivery reports, and clean up database records.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <a href="/api/exports/campaigns" download>
              <Button variant="outline" size="md" className="gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export All CSV</span>
              </Button>
            </a>
            <Link href="/campaigns/new">
              <Button variant="primary" size="md" className="gap-2">
                <PlusCircle className="w-4 h-4" />
                <span>Create Campaign</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search campaigns by name or sender..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="sending">Sending</option>
                <option value="queued">Queued</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Campaigns Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Campaign Name</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Recipients</th>
                  <th className="px-4 py-3.5">Delivered</th>
                  <th className="px-4 py-3.5">Clicks</th>
                  <th className="px-4 py-3.5">Unique Clickers</th>
                  <th className="px-4 py-3.5">Click Rate</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      No campaigns found. Click <strong>Create Campaign</strong> to get started.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((camp) => {
                    const stats = camp.statistics || {};
                    const sent = camp.recipientCount || stats.sent || 0;
                    const delivered = stats.delivered || 0;
                    const totalClicks = stats.totalClicks || 0;
                    const uniqueClickers = stats.uniqueClickers || 0;
                    const ctr = delivered > 0 ? (uniqueClickers / delivered) * 100 : 0;
                    return (
                      <tr key={camp._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          <div className="text-sm font-semibold">{camp.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Sender: <span className="font-mono text-slate-600">{camp.senderId}</span> • Created {formatDate(camp.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={camp.status} />
                        </td>
                        <td className="px-4 py-4 font-medium">{formatNumber(sent)}</td>
                        <td className="px-4 py-4 text-emerald-700 font-medium">
                          {formatNumber(delivered)}
                        </td>
                        <td className="px-4 py-4 font-semibold text-purple-700">
                          {formatNumber(totalClicks)}
                        </td>
                        <td className="px-4 py-4">{formatNumber(uniqueClickers)}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                            {formatPercentage(ctr)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/click-analytics?campaignId=${camp._id}`}>
                              <Button variant="outline" size="sm" className="gap-1 text-xs" title="View Click Analytics">
                                <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                                <span className="hidden md:inline">Analytics</span>
                              </Button>
                            </Link>
                            <a
                              href={`/api/exports/campaigns/${camp._id}`}
                              download
                              title="Download Full Campaign CSV Report"
                            >
                              <Button variant="secondary" size="sm" className="gap-1 text-xs text-emerald-700 hover:text-emerald-800">
                                <Download className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Report</span>
                              </Button>
                            </a>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCampaignToDelete(camp)}
                              className="text-xs text-red-600 hover:bg-red-50 hover:border-red-300 border-slate-200"
                              title="Delete Campaign and Cascade DB Cleanup"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
                <li>Campaign details and statistics</li>
                <li>All recipient records & queue delivery jobs ({campaignToDelete.recipientCount || 0} contacts)</li>
                <li>Generated unique tracking links</li>
                <li>Historical click logs & engagement attribution events</li>
              </ul>
              <p className="text-[11px] font-medium pt-1 text-red-800">
                This action cannot be undone.
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

