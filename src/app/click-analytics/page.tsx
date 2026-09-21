"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ClickTrendChart } from "@/components/dashboard/ClickTrendChart";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, PageHeader, Panel, SearchBox, SelectBox, btnSecondary, tbl } from "@/components/ui/page";
import { BarChart3, FileSpreadsheet, Flame, MousePointerClick, Percent, ShieldCheck, Users } from "lucide-react";
import { formatNumber, formatDateTime, cn } from "@/lib/utils";

export default function ClickAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <Skeleton className="h-96 rounded-2xl" />
        </AppLayout>
      }
    >
      <ClickAnalyticsContent />
    </Suspense>
  );
}

function ClickAnalyticsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCampaignId = searchParams.get("campaignId") || "all";

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>(initialCampaignId);
  const [data, setData] = useState<any>(null);
  const [attributions, setAttributions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fromUrl = searchParams.get("campaignId") || "all";
    if (fromUrl !== selectedCampaign) setSelectedCampaign(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    async function loadCampaignsList() {
      try {
        const res = await fetch("/api/campaigns?limit=100");
        const json = await res.json();
        setCampaigns(json.data || []);
      } catch (err) {
        console.error("Failed to load campaigns list", err);
      }
    }
    loadCampaignsList();
  }, []);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setIsLoading(true);
        const [resMetrics, resAttributions] = await Promise.all([
          fetch(`/api/analytics?campaignId=${selectedCampaign}`),
          fetch(`/api/analytics/attributions?campaignId=${selectedCampaign}&search=${encodeURIComponent(search)}`),
        ]);
        setData(await resMetrics.json());
        setAttributions((await resAttributions.json()).data || []);
      } catch (err) {
        console.error("Failed to load click analytics", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, [selectedCampaign, search]);

  const handleCampaignChange = (campaignId: string) => {
    setSelectedCampaign(campaignId);
    router.replace(campaignId === "all" ? "/click-analytics" : `/click-analytics?campaignId=${campaignId}`);
  };

  const currentCampaign = campaigns.find((c) => c._id === selectedCampaign);

  if (isLoading && !data) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-9 w-72" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  const m = data || { smsSent: 0, delivered: 0, totalClicks: 0, uniqueClickers: 0, clickRate: 0, highIntentLeads: 0, trend: [] };
  const funnel = [
    { label: "Sent", value: m.smsSent || 0, pct: m.smsSent > 0 ? 100 : 0, bar: "from-blue-500 to-sky-400" },
    { label: "Delivered", value: m.delivered || 0, pct: m.smsSent > 0 ? ((m.delivered || 0) / m.smsSent) * 100 : 0, bar: "from-emerald-500 to-teal-400" },
    { label: "Clicked", value: m.uniqueClickers || 0, pct: m.delivered > 0 ? ((m.uniqueClickers || 0) / m.delivered) * 100 : 0, bar: "from-indigo-500 to-violet-400" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Click analytics"
          subtitle={currentCampaign ? `Showing ${currentCampaign.name}` : "Who clicked your links, across all campaigns."}
          actions={
            <>
              <SelectBox value={selectedCampaign} onChange={handleCampaignChange} label="Choose a campaign" className="max-w-[16rem]">
                <option value="all">All campaigns</option>
                {campaigns.map((camp) => (
                  <option key={camp._id} value={camp._id}>
                    {camp.name}
                  </option>
                ))}
              </SelectBox>
              <a href={selectedCampaign !== "all" ? `/api/exports/campaigns/${selectedCampaign}` : "/api/exports/campaigns"} download className={btnSecondary}>
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                Export CSV
              </a>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Clicks" value={m.totalClicks || 0} tone="indigo" icon={MousePointerClick} sub="Real people, bots removed" />
          <KpiCard label="People who clicked" value={m.uniqueClickers || 0} tone="blue" icon={Users} sub={m.smsSent > 0 ? `Out of ${formatNumber(m.delivered || 0)} delivered` : "No messages sent yet"} />
          <KpiCard label="Click rate" value={m.clickRate || 0} suffix="%" decimals={1} tone="emerald" icon={Percent} sub="People who clicked ÷ delivered" />
          <KpiCard label="Hot leads" value={m.highIntentLeads || 0} tone="amber" icon={Flame} sub={`${formatNumber(m.botScansFiltered || 0)} bot clicks filtered out`} href="/active-leads" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-2" title="Clicks over time" description="Total clicks and people who clicked, per day">
            {(m.trend || []).length === 0 ? (
              <EmptyState icon={BarChart3} title="No clicks yet" body="They appear here as soon as someone taps a link." />
            ) : (
              <ClickTrendChart data={m.trend} />
            )}
          </Panel>

          <Panel title="Results" description="From sent to clicked">
            <div className="space-y-5">
              {funnel.map((r, i) => (
                <div key={r.label}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{r.label}</span>
                    <span className="tabular-nums text-slate-900 dark:text-white">
                      <strong className="font-bold">{formatNumber(r.value)}</strong>
                      {i > 0 && <span className="ml-1.5 text-xs text-slate-400">{r.pct.toFixed(1)}%</span>}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div className={cn("h-full rounded-full bg-gradient-to-r", r.bar)} style={{ width: `${Math.min(100, r.pct)}%` }} />
                  </div>
                </div>
              ))}
              <p className="flex items-start gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                Link-preview bots and prefetch requests are filtered out of these numbers.
              </p>
            </div>
          </Panel>
        </div>

        <Panel
          flush
          title="Who clicked"
          description="Each person's clicks and how engaged they are"
          actions={<SearchBox value={search} onChange={setSearch} placeholder="Search phone or tracking ID" className="w-full sm:w-64 sm:flex-none" />}
        >
          {attributions.length === 0 ? (
            <EmptyState icon={MousePointerClick} title="No clicks to show" body="Nothing recorded for this selection yet." />
          ) : (
            <div className={tbl.wrap}>
              <table className={tbl.table}>
                <thead className={tbl.head}>
                  <tr>
                    <th className={tbl.th}>Phone</th>
                    <th className={`${tbl.th} hidden md:table-cell`}>Campaign</th>
                    <th className={`${tbl.th} text-right`}>Clicks</th>
                    <th className={`${tbl.th} hidden lg:table-cell`}>Last click</th>
                    <th className={tbl.th}>Engagement</th>
                    <th className={`${tbl.th} text-right`}>Status</th>
                  </tr>
                </thead>
                <tbody className={tbl.body}>
                  {attributions.map((attr, idx) => (
                    <tr key={attr._id || idx} className={tbl.row}>
                      <td className={tbl.td}>
                        <span className={`block ${tbl.mono}`}>{attr.phone}</span>
                        <span className="text-xs text-slate-400">ID {attr.trackingId}</span>
                      </td>
                      <td className={`${tbl.td} hidden md:table-cell`}>{attr.campaignName}</td>
                      <td className={`${tbl.td} text-right font-bold tabular-nums text-indigo-700 dark:text-indigo-300`}>{attr.clicks}</td>
                      <td className={`${tbl.td} hidden text-xs text-slate-400 lg:table-cell`}>{formatDateTime(attr.lastClick)}</td>
                      <td className={tbl.td}>
                        <div className="flex items-center gap-2">
                          <span className="w-7 text-xs font-bold tabular-nums">{attr.score}</span>
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                            <span className="block h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${Math.min(100, attr.score)}%` }} />
                          </span>
                        </div>
                      </td>
                      <td className={`${tbl.td} text-right`}>
                        <Badge variant={attr.status === "High Intent" ? "success" : "default"}>{attr.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </AppLayout>
  );
}
