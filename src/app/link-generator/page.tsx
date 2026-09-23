"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { TablePageSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, PageHeader, Panel, SearchBox, SelectBox, Toolbar, btnPrimary, btnSecondary, iconBtn, tbl } from "@/components/ui/page";
import { Check, Copy, Download, Link2, PlusCircle } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default function LinkGeneratorPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <TablePageSkeleton titleWidth="w-64" rowCount={5} />
        </AppLayout>
      }
    >
      <TrackingLinksContent />
    </Suspense>
  );
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={iconBtn}
      aria-label="Copy link"
      title="Copy link"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard blocked */
        }
      }}
    >
      {done ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function TrackingLinksContent() {
  const searchParams = useSearchParams();
  const initialCampaignId = searchParams.get("campaignId") || "all";

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>(initialCampaignId);
  const [search, setSearch] = useState("");
  const [mappings, setMappings] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const res = await fetch("/api/campaigns?limit=50");
        const json = await res.json();
        const list = json.data || [];
        setCampaigns(list);
        if (initialCampaignId !== "all" && list.some((c: any) => c._id === initialCampaignId)) {
          setSelectedCampaign(initialCampaignId);
        }
      } catch (err) {
        console.error("Failed to load campaigns", err);
      }
    }
    loadCampaigns();
  }, [initialCampaignId]);

  useEffect(() => {
    async function loadMappings() {
      setIsLoading(true);
      try {
        const campParam = selectedCampaign !== "all" ? `&campaignId=${selectedCampaign}` : "";
        const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
        const res = await fetch(`/api/tracking-links?limit=50${campParam}${searchParam}`);
        const json = await res.json();
        setMappings(json.links || []);
        setTotalCount(json.total || 0);
      } catch (err) {
        console.error("Failed to load tracking links", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMappings();
  }, [selectedCampaign, search]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Tracking links"
          subtitle="Every recipient gets their own short link. Find any link, copy it, or see who clicked."
          actions={
            <>
              {selectedCampaign !== "all" && totalCount > 0 && (
                <a href={`/api/exports/tracking/${selectedCampaign}`} download className={btnSecondary}>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Export CSV
                </a>
              )}
              <Link href="/campaigns/new" className={btnPrimary}>
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                New campaign
              </Link>
            </>
          }
        />

        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search by phone or tracking ID" />
          <SelectBox value={selectedCampaign} onChange={setSelectedCampaign} label="Filter by campaign" className="sm:max-w-[16rem]">
            <option value="all">All campaigns</option>
            {campaigns.map((camp) => (
              <option key={camp._id} value={camp._id}>
                {camp.name}
              </option>
            ))}
          </SelectBox>
        </Toolbar>

        <Panel
          flush
          title="Links"
          description={totalCount > 0 ? `${formatNumber(totalCount)} in total · showing the latest ${formatNumber(mappings.length)}` : undefined}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-14 text-sm text-slate-400">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              Loading links…
            </div>
          ) : mappings.length === 0 ? (
            <EmptyState
              icon={Link2}
              title="No tracking links yet"
              body="Links are created automatically for every recipient as soon as you create a campaign — no need to send it first."
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
                    <th className={tbl.th}>Phone</th>
                    <th className={tbl.th}>Tracking ID</th>
                    <th className={tbl.th}>Short link</th>
                    <th className={`${tbl.th} text-right`}>Clicked</th>
                  </tr>
                </thead>
                <tbody className={tbl.body}>
                  {mappings.map((m, idx) => {
                    const shortUrl = m.trackingUrl || `${origin}/t/${m.trackingId}`;
                    return (
                      <tr key={m._id || idx} className={tbl.row}>
                        <td className={`${tbl.td} ${tbl.mono}`}>{m.phone}</td>
                        <td className={tbl.td}>
                          <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">{m.trackingId}</span>
                        </td>
                        <td className={tbl.td}>
                          <div className="flex items-center gap-1">
                            <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="max-w-[16rem] truncate font-mono text-[13px] text-blue-600 hover:underline dark:text-blue-400" title={shortUrl}>
                              {shortUrl}
                            </a>
                            <CopyButton text={shortUrl} />
                          </div>
                        </td>
                        <td className={`${tbl.td} text-right`}>
                          {m.clickStatus === "clicked" ? <Badge variant="success">Clicked</Badge> : <span className="text-xs text-slate-400">Not yet</span>}
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
    </AppLayout>
  );
}
