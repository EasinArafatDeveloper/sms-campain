"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/Badge";
import { TablePageSkeleton } from "@/components/ui/Skeleton";
import {
  ConfirmDelete,
  ConfirmSend,
  EmptyState,
  Notice,
  PageHeader,
  Panel,
  SearchBox,
  SelectBox,
  Toolbar,
  btnPrimary,
  btnSecondary,
  iconBtn,
  tbl,
} from "@/components/ui/page";
import { BarChart3, Download, FileSpreadsheet, Send, PlusCircle, Trash2 } from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";

// Campaigns can only be sent from these states — matches the /send route's own check.
const SENDABLE_STATUSES = new Set(["draft", "scheduled", "paused", "failed"]);

export default function CampaignsListPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <TablePageSkeleton titleWidth="w-72" rowCount={6} />
        </AppLayout>
      }
    >
      <CampaignsListContent />
    </Suspense>
  );
}

function CampaignsListContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("search") || "";
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [search, setSearch] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Sync search when the header search sends us here with ?search=
  useEffect(() => {
    const q = searchParams.get("search");
    if (q !== null) setSearch(q);
  }, [searchParams]);

  const [campaignToDelete, setCampaignToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [campaignToSend, setCampaignToSend] = useState<any | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSendConfirm() {
    if (!campaignToSend) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignToSend._id}/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to send campaign");
      setNotification({ type: "success", message: `“${campaignToSend.name}” is being sent.` });
      setCampaignToSend(null);
      loadCampaigns();
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to send campaign" });
      setCampaignToSend(null);
    } finally {
      setIsSending(false);
    }
  }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  async function handleDeleteConfirm() {
    if (!campaignToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignToDelete._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete campaign");

      setCampaigns((prev) => prev.filter((c) => c._id !== campaignToDelete._id));
      setNotification({ type: "success", message: `“${campaignToDelete.name}” was deleted.` });
      setCampaignToDelete(null);
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to delete campaign" });
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

  const filtered = search !== "" || statusFilter !== "all";

  return (
    <AppLayout>
      <div className="space-y-6">
        {notification && (
          <Notice type={notification.type} onClose={() => setNotification(null)}>
            {notification.message}
          </Notice>
        )}

        <PageHeader
          title="Campaigns"
          subtitle="Everything you have sent or saved, with how it performed."
          actions={
            <>
              <a href="/api/exports/campaigns" download className={btnSecondary}>
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                Export CSV
              </a>
              <Link href="/campaigns/new" className={btnPrimary}>
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                New campaign
              </Link>
            </>
          }
        />

        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search by name or sender" />
          <SelectBox value={statusFilter} onChange={setStatusFilter} label="Filter by status">
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="sending">Sending</option>
            <option value="queued">Queued</option>
            <option value="draft">Draft</option>
          </SelectBox>
        </Toolbar>

        <Panel flush>
          {campaigns.length === 0 ? (
            <EmptyState
              icon={Send}
              title={filtered ? "No campaigns match" : "No campaigns yet"}
              body={filtered ? "Try a different search or status." : "Create your first campaign and see who clicks."}
              action={
                !filtered && (
                  <Link href="/campaigns/new" className={btnPrimary}>
                    <PlusCircle className="h-4 w-4" aria-hidden="true" />
                    New campaign
                  </Link>
                )
              }
            />
          ) : (
            <div className={tbl.wrap}>
              <table className={tbl.table}>
                <thead className={tbl.head}>
                  <tr>
                    <th className={tbl.th}>Campaign</th>
                    <th className={tbl.th}>Status</th>
                    <th className={`${tbl.th} text-right`}>Recipients</th>
                    <th className={`${tbl.th} hidden text-right lg:table-cell`}>Delivered</th>
                    <th className={`${tbl.th} text-right`}>Clicks</th>
                    <th className={`${tbl.th} text-right`}>Click rate</th>
                    <th className={`${tbl.th} text-right`}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className={tbl.body}>
                  {campaigns.map((camp) => {
                    const stats = camp.statistics || {};
                    const sent = camp.recipientCount || stats.sent || 0;
                    const delivered = stats.delivered || 0;
                    const ctr = delivered > 0 ? ((stats.uniqueClickers || 0) / delivered) * 100 : 0;
                    return (
                      <tr key={camp._id} className={`group ${tbl.row}`}>
                        <td className={tbl.td}>
                          <Link href={`/campaigns/${camp._id}`} className="block focus-visible:outline-none">
                            <span className="font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300">{camp.name}</span>
                            <span className="mt-0.5 block text-xs text-slate-400">
                              {camp.senderId} · {formatDate(camp.createdAt)}
                            </span>
                          </Link>
                        </td>
                        <td className={tbl.td}>
                          <StatusBadge status={camp.status} />
                        </td>
                        <td className={`${tbl.td} text-right font-medium tabular-nums`}>{formatNumber(sent)}</td>
                        <td className={`${tbl.td} hidden text-right tabular-nums lg:table-cell`}>{formatNumber(delivered)}</td>
                        <td className={`${tbl.td} text-right font-semibold tabular-nums text-indigo-700 dark:text-indigo-300`}>{formatNumber(stats.totalClicks || 0)}</td>
                        <td className={tbl.td}>
                          <div className="ml-auto flex w-24 items-center justify-end gap-2">
                            <span className="text-xs font-semibold tabular-nums">{ctr.toFixed(1)}%</span>
                            <span className="h-1.5 w-10 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                              <span className="block h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${Math.min(100, ctr * 3)}%` }} />
                            </span>
                          </div>
                        </td>
                        <td className={tbl.td}>
                          <div className="flex items-center justify-end gap-0.5">
                            {SENDABLE_STATUSES.has(camp.status) && (
                              <button
                                type="button"
                                onClick={() => setCampaignToSend(camp)}
                                className={`${iconBtn} hover:!bg-indigo-50 hover:!text-indigo-600 dark:hover:!bg-indigo-500/10`}
                                aria-label={`Send ${camp.name}`}
                                title="Send campaign"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}
                            <Link href={`/click-analytics?campaignId=${camp._id}`} className={iconBtn} aria-label={`Click analytics for ${camp.name}`} title="Click analytics">
                              <BarChart3 className="h-4 w-4" />
                            </Link>
                            <a href={`/api/exports/campaigns/${camp._id}`} download className={iconBtn} aria-label={`Download CSV for ${camp.name}`} title="Download CSV">
                              <Download className="h-4 w-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => setCampaignToDelete(camp)}
                              className={`${iconBtn} hover:!bg-rose-50 hover:!text-rose-600 dark:hover:!bg-rose-500/10`}
                              aria-label={`Delete ${camp.name}`}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {campaignToDelete && (
        <ConfirmDelete name={campaignToDelete.name} loading={isDeleting} onCancel={() => setCampaignToDelete(null)} onConfirm={handleDeleteConfirm} />
      )}

      {campaignToSend && (
        <ConfirmSend
          name={campaignToSend.name}
          recipientCount={campaignToSend.recipientCount || 0}
          loading={isSending}
          onCancel={() => setCampaignToSend(null)}
          onConfirm={handleSendConfirm}
        />
      )}
    </AppLayout>
  );
}
