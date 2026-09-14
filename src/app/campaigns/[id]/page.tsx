"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { TablePageSkeleton } from "@/components/ui/Skeleton";
import {
  ArrowLeft,
  Download,
  BarChart3,
  Trash2,
  Search,
  Filter,
  Users,
  Send,
  CheckCircle2,
  MousePointerClick,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  Sparkles,
  Flame,
  Zap,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { formatNumber, formatPercentage, formatDate } from "@/lib/utils";

export default function CampaignReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const campaignId = resolvedParams.id;
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "clicked" | "high_intent" | "delivered" | "failed">("all");
  const [page, setPage] = useState(1);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadCampaignReport() {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/campaigns/${campaignId}?detailed=true&page=${page}&limit=50&search=${encodeURIComponent(
          search
        )}&filter=${filterType}`
      );
      if (!res.ok) throw new Error("Failed to load campaign report");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCampaignReport();
  }, [campaignId, page, search, filterType]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(text);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  async function handleDeleteCampaign() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete campaign");
      router.push("/campaigns");
    } catch (err: any) {
      alert(err.message || "Failed to delete campaign");
      setIsDeleting(false);
    }
  }

  if (isLoading && !data) {
    return (
      <AppLayout>
        <TablePageSkeleton titleWidth="w-80" rowCount={8} />
      </AppLayout>
    );
  }

  const campaign = data?.campaign || {};
  const summary = data?.summary || {};
  const recipients = data?.recipients || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const totalRecipients = summary.totalRecipients || campaign.recipientCount || 0;
  const delivered = summary.delivered || 0;
  const deliveryRate = totalRecipients > 0 ? Number(((delivered / totalRecipients) * 100).toFixed(1)) : 0;
  const totalClicks = summary.totalClicks || 0;
  const uniqueClickers = summary.uniqueClickers || 0;
  const ctr = delivered > 0 ? Number(((uniqueClickers / delivered) * 100).toFixed(1)) : 0;
  const highIntent = summary.highIntentLeads || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/campaigns">
              <Button variant="outline" size="sm" className="gap-1 px-2.5 text-xs">
                <ArrowLeft className="w-4 h-4" />
                <span>Campaigns</span>
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{campaign.name || "Campaign Report"}</h1>
                <StatusBadge status={campaign.status || "queued"} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Sender ID: <span className="font-mono font-semibold text-slate-700">{campaign.senderId}</span> • Created {formatDate(campaign.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="md" onClick={() => loadCampaignReport()} className="gap-1.5" title="Refresh Live Stats">
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
            <a href={`/api/exports/campaigns/${campaignId}`} download>
              <Button variant="outline" size="md" className="gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export CSV Report</span>
              </Button>
            </a>
            <Link href={`/click-analytics?campaignId=${campaignId}`}>
              <Button variant="outline" size="md" className="gap-2 text-blue-700 border-blue-200 hover:bg-blue-50">
                <BarChart3 className="w-4 h-4" />
                <span>Click Analytics</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowDeleteModal(true)}
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </Button>
          </div>
        </div>

        {/* 6 KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <StatCard
            title="Total Contacts"
            value={formatNumber(totalRecipients)}
            subtitle="Recipients"
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Delivered SMS"
            value={formatNumber(delivered)}
            subtitle={`${deliveryRate}% Success`}
            icon={CheckCircle2}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatCard
            title="Total Clicks"
            value={formatNumber(totalClicks)}
            subtitle="All link visits"
            icon={MousePointerClick}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
          <StatCard
            title="Unique Clickers"
            value={formatNumber(uniqueClickers)}
            subtitle={`${ctr}% CTR`}
            icon={Sparkles}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <StatCard
            title="High Intent Leads"
            value={formatNumber(highIntent)}
            subtitle="2+ Clicks"
            icon={Flame}
            iconBg="bg-rose-50"
            iconColor="text-rose-600"
          />
          <StatCard
            title="Failed SMS"
            value={formatNumber(summary.failed || 0)}
            subtitle="Gateway bounce"
            icon={AlertTriangle}
            iconBg="bg-slate-100"
            iconColor="text-slate-600"
          />
        </div>

        {/* Campaign Info & Message Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2 p-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Message Body & Template</h3>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-wrap">
              {campaign.message || "No message content"}
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tracking Configuration</h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Destination URL:</span>
                <a
                  href={campaign.trackingConfig?.destinationUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-blue-600 hover:underline inline-flex items-center gap-1 break-all"
                >
                  <span>{campaign.trackingConfig?.destinationUrl || "N/A"}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                <span className="text-slate-400">URL Format:</span>
                <span className="font-semibold text-slate-700 capitalize">{campaign.trackingConfig?.format || "Alphanumeric"} ({campaign.trackingConfig?.length || 6} chars)</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Link Keyword/Prefix:</span>
                <span className="font-mono font-bold text-blue-600">/{campaign.trackingConfig?.urlPrefix || "eid"}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Per-Contact Number List & Click Details Table */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Contact Number & Click Intelligence</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Individual recipient delivery status, personalized unique tracking link, and real-time click counts.
                </CardDescription>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search phone, name, or code..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterType("all");
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                      filterType === "all"
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    All ({formatNumber(totalRecipients)})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFilterType("clicked");
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                      filterType === "clicked"
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-white text-purple-700 border-slate-200 hover:bg-purple-50"
                    }`}
                  >
                    🔥 Clicked ({formatNumber(uniqueClickers)})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFilterType("high_intent");
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                      filterType === "high_intent"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-white text-rose-700 border-slate-200 hover:bg-rose-50"
                    }`}
                  >
                    ⚡ High Intent ({formatNumber(highIntent)})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFilterType("delivered");
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                      filterType === "delivered"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white text-emerald-700 border-slate-200 hover:bg-emerald-50"
                    }`}
                  >
                    ✅ Delivered
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Recipient Number</th>
                  <th className="px-4 py-3">SMS Status</th>
                  <th className="px-5 py-3">Personalized Link</th>
                  <th className="px-4 py-3 text-center">Click Count</th>
                  <th className="px-4 py-3">Engagement Level</th>
                  <th className="px-5 py-3">Click Timestamps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recipients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No recipients matching your search or filter.
                    </td>
                  </tr>
                ) : (
                  recipients.map((item: any) => {
                    const isCopied = copiedLink === item.uniqueUrl;
                    return (
                      <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Recipient Phone & Name */}
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900 font-mono">{item.phone}</div>
                          <div className="text-[11px] text-slate-400">{item.name || "Customer"}</div>
                        </td>

                        {/* SMS Status */}
                        <td className="px-4 py-3.5">
                          <StatusBadge status={item.status} />
                          {item.deliveredAt && (
                            <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(item.deliveredAt)}</div>
                          )}
                          {item.errorMessage && (
                            <div className="text-[10px] text-red-500 mt-0.5 max-w-xs truncate" title={item.errorMessage}>
                              {item.errorMessage}
                            </div>
                          )}
                        </td>

                        {/* Unique Tracking Link */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100 max-w-[200px] truncate">
                              {item.uniqueUrl}
                            </span>
                            {item.uniqueUrl && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(item.uniqueUrl)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                                title="Copy unique link"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Click Count */}
                        <td className="px-4 py-3.5 text-center">
                          {item.clickCount > 0 ? (
                            <span
                              className={`inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold rounded-full ${
                                item.clickCount >= 2
                                  ? "bg-rose-100 text-rose-800 ring-1 ring-rose-300"
                                  : "bg-purple-100 text-purple-800 ring-1 ring-purple-300"
                              }`}
                            >
                              {item.clickCount} {item.clickCount === 1 ? "click" : "clicks"}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-mono">0</span>
                          )}
                        </td>

                        {/* Engagement Status */}
                        <td className="px-4 py-3.5">
                          {item.clickCount >= 2 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <Flame className="w-3 h-3 text-rose-500" />
                              High Intent
                            </span>
                          ) : item.clickCount === 1 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Zap className="w-3 h-3 text-purple-500" />
                              Engaged
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">No Clicks</span>
                          )}
                        </td>

                        {/* Click Timestamps */}
                        <td className="px-5 py-3.5 text-[11px]">
                          {item.lastClickedAt ? (
                            <div className="space-y-0.5">
                              <div className="text-slate-700 font-medium">Last: {formatDate(item.lastClickedAt)}</div>
                              {item.firstClickedAt && item.firstClickedAt !== item.lastClickedAt && (
                                <div className="text-slate-400 text-[10px]">First: {formatDate(item.firstClickedAt)}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, total)} of {formatNumber(total)} contacts
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="gap-1 px-2"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </Button>
                <span className="px-2 font-semibold text-slate-700">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="gap-1 px-2"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Delete Campaign Cascade Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Delete Campaign Permanently?</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete <strong className="text-slate-800 font-semibold">{campaign.name}</strong>?
                </p>
              </div>
            </div>

            <div className="p-3 bg-red-50/70 border border-red-200/60 rounded-xl text-xs text-red-700 space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                <span>Database Cleanup Notice:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-red-600/90">
                <li>All recipient numbers ({totalRecipients} contacts)</li>
                <li>All generated unique tracking links</li>
                <li>All click event logs and attribution history</li>
                <li>Queue delivery jobs & campaign metrics</li>
              </ul>
              <p className="text-[11px] font-medium pt-1 text-red-800">
                All records will be completely removed from the database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleDeleteCampaign}
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
