"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import {
  ListOrdered,
  RotateCw,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Play,
  Server,
  ShieldCheck,
} from "lucide-react";
import { formatNumber, formatDateTime } from "@/lib/utils";

export default function DeliveryQueuePage() {
  const [data, setData] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQueueData = async () => {
    try {
      const res = await fetch(`/api/delivery-queue?status=${statusFilter}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load queue data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 5000); // Polling every 5s
    return () => clearInterval(interval);
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
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-md" />
              <div className="h-4 w-96 bg-slate-200 animate-pulse rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 bg-white border border-slate-200 rounded-xl p-4 animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-white border border-slate-200 rounded-xl p-6 animate-pulse" />
        </div>
      </AppLayout>
    );
  }

  const stats = data?.stats || {
    totalQueued: 0,
    processing: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    pendingRetry: 0,
  };

  const health = data?.health || {
    provider: "BULKSMSBD",
    status: "operational",
    averageResponseMs: 42,
    successRate: 99.4,
    requestsPerMinute: 0,
    retries: 0,
    balance: 15420.5,
    currency: "BDT",
  };

  const jobs = data?.jobs || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Delivery Queue & Dispatcher</h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time SMS queue monitoring, exponential backoff retries, and BulkSMSBD gateway status.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="md" onClick={fetchQueueData} className="gap-1.5">
              <RotateCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleProcessBatch}
              isLoading={isProcessing}
              className="gap-1.5 shadow-sm"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Dispatch Batch (50 SMS)</span>
            </Button>
          </div>
        </div>

        {/* 6 KPI Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            title="Total Queued"
            value={stats.totalQueued}
            icon={ListOrdered}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="Processing"
            value={stats.processing}
            icon={RotateCw}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />
          <StatCard
            title="Sent"
            value={stats.sent}
            icon={Zap}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
          />
          <StatCard
            title="Delivered"
            value={stats.delivered}
            icon={CheckCircle2}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
          <StatCard
            title="Failed"
            value={stats.failed}
            icon={XCircle}
            iconColor="text-rose-600"
            iconBg="bg-rose-50"
          />
          <StatCard
            title="Pending Retry"
            value={stats.pendingRetry}
            icon={AlertTriangle}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />
        </div>

        {/* Pipeline Stage Banner */}
        <Card className="p-4 bg-slate-900 text-white border-0 shadow-md">
          <div className="flex items-center justify-between flex-wrap gap-4 text-xs font-semibold">
            <div className="flex items-center gap-2 text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>1. Link Generated</span>
            </div>
            <span className="text-slate-600 font-bold">→</span>
            <div className="flex items-center gap-2 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>2. Queued in Redis/DB</span>
            </div>
            <span className="text-slate-600 font-bold">→</span>
            <div className="flex items-center gap-2 text-indigo-400">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>3. API Processing</span>
            </div>
            <span className="text-slate-600 font-bold">→</span>
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>4. Delivered & Tracked</span>
            </div>
          </div>
        </Card>

        {/* Main Grid: Queue Table + API Health Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Delivery Queue Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Delivery Queue Activity</CardTitle>
                <CardDescription>Live telemetry stream of outbound SMS jobs</CardDescription>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white font-medium text-slate-700"
              >
                <option value="all">All Jobs</option>
                <option value="queued">Queued</option>
                <option value="processing">Processing</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="pending_retry">Pending Retry</option>
                <option value="failed">Failed</option>
              </select>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Queue ID</th>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Tracking ID</th>
                    <th className="px-4 py-3">Delivery Status</th>
                    <th className="px-4 py-3">Attempt</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-5 py-3 text-right">Click Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-sans">
                        No outbound messages in delivery queue. Newly launched campaigns will appear here in real-time.
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job: any, index: number) => {
                    const queueId = job._id ? `Q-${String(job._id).slice(-5)}` : `Q-8921${index}`;
                    return (
                      <tr key={job._id || index} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900">{queueId}</td>
                        <td className="px-4 py-3.5 text-slate-600">{job.phone}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-100">
                            {job.trackingId}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-sans">
                          <StatusBadge status={job.status} />
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">{job.attempts || 1}/3</td>
                        <td className="px-4 py-3.5 font-sans text-slate-400 text-[11px]">
                          {formatDateTime(job.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-sans">
                          {job.clickStatus === "clicked" ? (
                            <Badge variant="purple" className="font-semibold">
                              Clicked
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Not clicked</span>
                          )}
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* API Health & Live Feed Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-sm">SMS Gateway Health</CardTitle>
                </div>
                <Badge variant="success" className="text-[10px]">
                  {health.status.toUpperCase()}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Provider</span>
                  <strong className="text-slate-900">{health.provider} (Bangladesh)</strong>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Average Response</span>
                  <span className="font-semibold text-emerald-600">{health.averageResponseMs} ms</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Success Rate</span>
                  <span className="font-semibold text-blue-600">{health.successRate}%</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Throughput</span>
                  <span className="font-semibold text-slate-900">{health.requestsPerMinute} req/min</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Account Balance</span>
                  <strong className="text-slate-900 text-sm font-bold">
                    {formatNumber(health.balance)} {health.currency || "BDT"}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Automatic Retries</span>
                  <span className="font-semibold text-amber-600">{health.retries} pending</span>
                </div>
              </CardContent>
            </Card>

            {/* Live Activity Feed */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <CardTitle className="text-sm">Live Activity Feed</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-slate-700">
                  <div className="font-semibold text-emerald-900">Delivery Status Updated</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">8801711234567 • Delivered successfully</div>
                </div>
                <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-100 text-slate-700">
                  <div className="font-semibold text-purple-900">Link Click Attributed</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Tracking ID 583214 • Destination opened</div>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-slate-700">
                  <div className="font-semibold text-blue-900">Batch Job Dispatched</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">50 messages queued to BulkSMSBD</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
