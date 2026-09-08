"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { PlusCircle, Search, Filter, BarChart3, Download, Send, ArrowRight } from "lucide-react";
import { formatNumber, formatPercentage, formatDate } from "@/lib/utils";

import { TablePageSkeleton } from "@/components/ui/Skeleton";

export default function CampaignsListPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    loadCampaigns();
  }, [search, statusFilter]);

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">SMS Marketing Campaigns</h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage broadcast campaigns, monitor real-time delivery status, and view link engagement metrics.
            </p>
          </div>
          <Link href="/campaigns/new">
            <Button variant="primary" size="md" className="gap-2">
              <PlusCircle className="w-4 h-4" />
              <span>Create Campaign</span>
            </Button>
          </Link>
        </div>

        {/* Filters and Search */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search campaigns by name..."
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
                            Sender: {camp.senderId} • Created {formatDate(camp.createdAt)}
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
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/click-analytics?campaignId=${camp._id}`}>
                              <Button variant="outline" size="sm" className="gap-1 text-xs">
                                <BarChart3 className="w-3.5 h-3.5" />
                                Analytics
                              </Button>
                            </Link>
                            <a href={`/api/exports/tracking/${camp._id}`} download>
                              <Button variant="secondary" size="sm" className="gap-1 text-xs">
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                            </a>
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
    </AppLayout>
  );
}
