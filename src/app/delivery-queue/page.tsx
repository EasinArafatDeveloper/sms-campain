"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, PageHeader, Panel, SelectBox, btnPrimary, btnSecondary, tbl } from "@/components/ui/page";
import { AlertTriangle, CheckCircle2, ListOrdered, Loader2, Play, RotateCw, Send, Server } from "lucide-react";
import { formatNumber, formatDateTime } from "@/lib/utils";

export default function DeliveryQueuePage() {
  const [data, setData] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQueueData = async () => {
    try {
      const res = await fetch(`/api/delivery-queue?status=${statusFilter}`);
      setData(await res.json());
    } catch (err) {
      console.error("Failed to load queue data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 5000); // refresh every 5s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleProcessBatch = async () => {
    setIsProcessing(true);
    try {
      await fetch("/api/delivery-queue/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50 }),
      });
      await fetchQueueData();
    } catch (err) {
      console.error("Batch processing error", err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading && !data) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-9 w-64" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  const stats = data?.stats || { totalQueued: 0, processing: 0, sent: 0, delivered: 0, failed: 0, pendingRetry: 0 };
  const health = data?.health || { provider: "ZENDSMS", status: "operational", successRate: 100, retries: 0 };
  const jobs: any[] = data?.jobs || [];
  const waiting = stats.totalQueued + stats.processing;

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Delivery queue"
          subtitle="Messages waiting to go out and how each one turned out. Updates every few seconds."
          actions={
            <>
              <button type="button" onClick={fetchQueueData} className={btnSecondary}>
                <RotateCw className="h-4 w-4" aria-hidden="true" />
                Refresh
              </button>
              <button type="button" onClick={handleProcessBatch} disabled={isProcessing || stats.totalQueued === 0} className={btnPrimary}>
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
                {stats.totalQueued > 0 ? `Send ${formatNumber(stats.totalQueued)} waiting` : "Nothing waiting"}
              </button>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Waiting" value={waiting} tone="blue" icon={ListOrdered} sub={waiting > 0 ? `${formatNumber(stats.processing)} being sent right now` : "Queue is empty"} />
          <KpiCard label="Sent" value={stats.sent} tone="indigo" icon={Send} sub="Handed to the gateway" />
          <KpiCard label="Delivered" value={stats.delivered} tone="emerald" icon={CheckCircle2} sub="Confirmed by the carrier" />
          <KpiCard
            label="Needs attention"
            value={stats.failed + stats.pendingRetry}
            tone={stats.failed > 0 ? "rose" : stats.pendingRetry > 0 ? "amber" : "emerald"}
            icon={AlertTriangle}
            sub={`${formatNumber(stats.failed)} failed · ${formatNumber(stats.pendingRetry)} retrying`}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Panel
            flush
            className="lg:col-span-2"
            title="Recent messages"
            description="Latest outbound SMS jobs"
            actions={
              <SelectBox value={statusFilter} onChange={setStatusFilter} label="Filter by status">
                <option value="all">All</option>
                <option value="queued">Queued</option>
                <option value="processing">Sending</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="pending_retry">Retrying</option>
                <option value="failed">Failed</option>
              </SelectBox>
            }
          >
            {jobs.length === 0 ? (
              <EmptyState
                icon={ListOrdered}
                title="Nothing here yet"
                body="Messages show up here once a campaign is sent. Open a draft campaign and hit “Send Campaign” to start."
                action={
                  <Link href="/campaigns" className={btnPrimary}>
                    Go to Campaigns
                  </Link>
                }
              />
            ) : (
              <div className={tbl.wrap}>
                <table className={tbl.table}>
                  <thead className={tbl.head}>
                    <tr>
                      <th className={tbl.th}>Recipient</th>
                      <th className={tbl.th}>Status</th>
                      <th className={`${tbl.th} hidden sm:table-cell`}>Attempt</th>
                      <th className={`${tbl.th} hidden md:table-cell`}>Time</th>
                      <th className={`${tbl.th} text-right`}>Clicked</th>
                    </tr>
                  </thead>
                  <tbody className={tbl.body}>
                    {jobs.map((job: any, index: number) => (
                      <tr key={job._id || index} className={tbl.row}>
                        <td className={tbl.td}>
                          <span className={`block ${tbl.mono}`}>{job.phone}</span>
                          {job.trackingId && <span className="text-xs text-slate-400">ID {job.trackingId}</span>}
                        </td>
                        <td className={tbl.td}>
                          <StatusBadge status={job.status} />
                        </td>
                        <td className={`${tbl.td} hidden text-slate-500 sm:table-cell`}>{job.attempts || 1} of 3</td>
                        <td className={`${tbl.td} hidden text-xs text-slate-400 md:table-cell`}>{job.createdAt ? formatDateTime(job.createdAt) : "—"}</td>
                        <td className={`${tbl.td} text-right`}>
                          {job.clickStatus === "clicked" ? <Badge variant="success">Clicked</Badge> : <span className="text-xs text-slate-400">Not yet</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="SMS gateway" description="The service that sends your messages">
            <dl className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Status</dt>
                <dd>
                  <Badge variant={health.status === "operational" ? "success" : "warning"}>{String(health.status).toUpperCase()}</Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 dark:border-white/10">
                <dt className="text-slate-500 dark:text-slate-400">Provider</dt>
                <dd className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                  <Server className="h-4 w-4 text-indigo-500" aria-hidden="true" />
                  {health.provider}
                </dd>
              </div>
              {typeof health.balance !== "undefined" && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 dark:border-white/10">
                  <dt className="text-slate-500 dark:text-slate-400">Gateway balance</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">
                    {formatNumber(health.balance)} {health.currency || "BDT"}
                  </dd>
                </div>
              )}
              {health.averageResponseMs > 0 && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 dark:border-white/10">
                  <dt className="text-slate-500 dark:text-slate-400">Response time</dt>
                  <dd className="font-semibold text-emerald-600 dark:text-emerald-400">{health.averageResponseMs} ms</dd>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 dark:border-white/10">
                <dt className="text-slate-500 dark:text-slate-400">Retrying</dt>
                <dd className="font-semibold text-amber-600 dark:text-amber-400">{formatNumber(health.retries || 0)} messages</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </AppLayout>
  );
}
