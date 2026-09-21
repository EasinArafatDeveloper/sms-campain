"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDelete, EmptyState, Notice, PageHeader, Panel, btnPrimary, btnSecondary, iconBtn, tbl } from "@/components/ui/page";
import { CheckCircle2, Download, FileSpreadsheet, FileText, MousePointerClick, PlusCircle, Send, Trash2 } from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const [reports, setReports] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [campaignToDelete, setCampaignToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function loadReports() {
    try {
      const res = await fetch("/api/reports");
      setReports(await res.json());
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
      const res = await fetch(`/api/campaigns/${campaignToDelete._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete campaign");

      setReports((prev: any) => {
        if (!prev) return prev;
        const updated = prev.campaigns.filter((c: any) => c._id !== campaignToDelete._id);
        return { ...prev, overview: { ...prev.overview, totalCampaigns: updated.length }, campaigns: updated };
      });
      setNotification({ type: "success", message: `“${campaignToDelete.name}” was deleted.` });
      setCampaignToDelete(null);
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to delete campaign" });
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading && !reports) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-9 w-64" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  const o = reports?.overview || { totalCampaigns: 0, totalSent: 0, averageDeliveryRate: 0, averageClickRate: 0, totalClicks: 0 };
  const list: any[] = reports?.campaigns || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {notification && (
          <Notice type={notification.type} onClose={() => setNotification(null)}>
            {notification.message}
          </Notice>
        )}

        <PageHeader
          title="Reports"
          subtitle="How every campaign performed, ready to download."
          actions={
            <>
              <a href="/api/exports/leads" download className={btnSecondary}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Hot leads CSV
              </a>
              <a href="/api/exports/campaigns" download className={btnPrimary}>
                <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                All campaigns CSV
              </a>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard label="Messages sent" value={o.totalSent || 0} tone="blue" icon={Send} sub={`${formatNumber(o.totalCampaigns || 0)} campaigns`} />
          <KpiCard label="Delivery rate" value={o.averageDeliveryRate || 0} suffix="%" decimals={1} tone="emerald" icon={CheckCircle2} sub="Delivered ÷ sent" />
          <KpiCard label="Click rate" value={o.averageClickRate || 0} suffix="%" decimals={1} tone="indigo" icon={MousePointerClick} sub={`${formatNumber(o.totalClicks || 0)} total clicks`} />
        </div>

        <Panel flush title="Campaign results" description="One row per campaign">
          {list.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No reports yet"
              body="Once you send a campaign, its results show up here."
              action={
                <Link href="/campaigns/new" className={btnPrimary}>
                  <PlusCircle className="h-4 w-4" aria-hidden="true" />
                  New campaign
                </Link>
              }
            />
          ) : (
            <div className={tbl.wrap}>
              <table className={tbl.table}>
                <thead className={tbl.head}>
                  <tr>
                    <th className={tbl.th}>Campaign</th>
                    <th className={`${tbl.th} text-right`}>Sent</th>
                    <th className={`${tbl.th} hidden text-right md:table-cell`}>Delivered</th>
                    <th className={`${tbl.th} text-right`}>Clicks</th>
                    <th className={`${tbl.th} hidden text-right sm:table-cell`}>Click rate</th>
                    <th className={`${tbl.th} hidden text-right lg:table-cell`}>Hot leads</th>
                    <th className={`${tbl.th} text-right`}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className={tbl.body}>
                  {list.map((c: any) => (
                    <tr key={c._id} className={`group ${tbl.row}`}>
                      <td className={tbl.td}>
                        <Link href={`/campaigns/${c._id}`} className="block focus-visible:outline-none">
                          <span className="font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300">{c.name}</span>
                          <span className="mt-0.5 block text-xs text-slate-400">{formatDate(c.date)}</span>
                        </Link>
                      </td>
                      <td className={`${tbl.td} text-right font-medium tabular-nums`}>{formatNumber(c.sent)}</td>
                      <td className={`${tbl.td} hidden text-right tabular-nums md:table-cell`}>
                        {formatNumber(c.delivered)} <span className="text-xs text-slate-400">({c.deliveryRate}%)</span>
                      </td>
                      <td className={`${tbl.td} text-right font-semibold tabular-nums text-indigo-700 dark:text-indigo-300`}>{formatNumber(c.clicks)}</td>
                      <td className={`${tbl.td} hidden text-right tabular-nums sm:table-cell`}>{c.clickRate}%</td>
                      <td className={`${tbl.td} hidden text-right font-semibold tabular-nums text-amber-600 dark:text-amber-400 lg:table-cell`}>{c.highIntent}</td>
                      <td className={tbl.td}>
                        <div className="flex items-center justify-end gap-0.5">
                          <a href={`/api/exports/campaigns/${c._id}`} download className={iconBtn} aria-label={`Download CSV for ${c.name}`} title="Download CSV">
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setCampaignToDelete(c)}
                            className={`${iconBtn} hover:!bg-rose-50 hover:!text-rose-600 dark:hover:!bg-rose-500/10`}
                            aria-label={`Delete ${c.name}`}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {campaignToDelete && (
        <ConfirmDelete name={campaignToDelete.name} loading={isDeleting} onCancel={() => setCampaignToDelete(null)} onConfirm={handleDeleteConfirm} />
      )}
    </AppLayout>
  );
}
