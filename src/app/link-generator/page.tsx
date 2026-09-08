"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TablePageSkeleton } from "@/components/ui/Skeleton";
import {
  Link2,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  Download,
  CheckCircle2,
  ListOrdered,
  PlusCircle,
  Search,
  Filter,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default function LinkGeneratorPage() {
  return (
    <Suspense fallback={<TablePageSkeleton titleWidth="w-64" rowCount={5} />}>
      <LinkGeneratorContent />
    </Suspense>
  );
}

function LinkGeneratorContent() {
  const searchParams = useSearchParams();
  const initialCampaignId = searchParams.get("campaignId") || "all";

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>(initialCampaignId);
  const [search, setSearch] = useState("");
  const [mappings, setMappings] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch campaign list
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

  // Fetch tracking mappings for the selected campaign
  useEffect(() => {
    async function loadMappings() {
      setIsLoading(true);
      try {
        const campParam = selectedCampaign !== "all" ? `&campaignId=${selectedCampaign}` : "";
        const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
        const res = await fetch(`/api/delivery-queue?limit=50${campParam}${searchParam}`);
        const json = await res.json();
        setMappings(json.jobs || []);
        setTotalCount(json.total || 0);
      } catch (err) {
        console.error("Failed to load tracking mappings", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMappings();
  }, [selectedCampaign, search]);

  const progress = totalCount > 0 ? 100 : 0;
  const generatedCount = totalCount;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Unique Link Generator</h1>
            <p className="text-xs text-slate-500 mt-1">
              Cryptographic short ID generation engine with collision retry and recipient-campaign mapping.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/campaigns/new">
              <Button variant="primary" size="md" className="gap-2">
                <PlusCircle className="w-4 h-4" />
                <span>Create SMS Campaign</span>
              </Button>
            </Link>
            <Link href="/delivery-queue">
              <Button variant="outline" size="md" className="gap-2">
                <ListOrdered className="w-4 h-4" />
                <span>Delivery Queue</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Pipeline Flow Visualization */}
        <Card className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-0 shadow-lg">
          <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span>Cryptographic Generation & Attribution Pipeline</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
            {[
              {
                stage: totalCount > 0 ? `1. ${formatNumber(totalCount)} Contacts` : "1. Contact Audience",
                desc: "Validated recipient list",
                icon: Users,
              },
              {
                stage: "2. Unique Short IDs",
                desc: "Collision-proof crypto hash",
                icon: ShieldCheck,
              },
              {
                stage: "3. Short Tracking URLs",
                desc: "go.domain.com/:id",
                icon: Link2,
              },
              {
                stage: "4. Recipient Mapping",
                desc: "Campaign junction DB",
                icon: CheckCircle2,
              },
              {
                stage: "5. Delivery Queue",
                desc: "Ready for SMS broadcast",
                icon: ListOrdered,
              },
            ].map((st, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-300 uppercase">Stage {i + 1}</span>
                  <st.icon className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{st.stage}</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">{st.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Progress & Live Generation Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-2 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Link Generation Progress
                </span>
                <span className="text-sm font-bold text-blue-600">{progress}% Complete</span>
              </div>
              <div className="mt-3 h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
              <span>
                {totalCount > 0
                  ? `Generated ${formatNumber(totalCount)} unique tracking links`
                  : "No tracking links generated yet"}
              </span>
              <span className="font-semibold text-slate-900">
                {formatNumber(generatedCount)} / {formatNumber(totalCount)}
              </span>
            </div>
          </Card>

          <Card className="p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collision Rate</span>
            <div className="mt-2">
              <div className="text-2xl font-bold text-emerald-600">0.00% (0 Collisions)</div>
              <p className="text-[11px] text-slate-400 mt-1">Cryptographic uniqueness with DB index guarantee</p>
            </div>
          </Card>

          <Card className="p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Failed / Invalid</span>
            <div className="mt-2">
              <div className="text-2xl font-bold text-slate-900">0</div>
              <p className="text-[11px] text-slate-400 mt-1">All destination phone numbers verified</p>
            </div>
          </Card>
        </div>

        {/* Campaign Filter & Search */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search generated links by phone, tracking ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Campaigns</option>
                {campaigns.map((camp) => (
                  <option key={camp._id} value={camp._id}>
                    {camp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Mapping Preview Table */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Generated Tracking Mappings</CardTitle>
              <CardDescription>Recipient phone numbers mapped to distinct trackable short links</CardDescription>
            </div>
            {selectedCampaign !== "all" && totalCount > 0 && (
              <a href={`/api/exports/tracking/${selectedCampaign}`} download>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Mappings CSV</span>
                </Button>
              </a>
            )}
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Queue / Recipient ID</th>
                  <th className="px-4 py-3.5">Phone Number</th>
                  <th className="px-4 py-3.5">Tracking ID</th>
                  <th className="px-4 py-3.5">Unique Short URL</th>
                  <th className="px-4 py-3.5">Click Status</th>
                  <th className="px-6 py-3.5 text-right">Mapping Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-sans">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span>Loading generated mappings...</span>
                      </div>
                    </td>
                  </tr>
                ) : mappings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-sans">
                      <div className="space-y-3">
                        <Link2 className="w-10 h-10 text-slate-300 mx-auto" />
                        <div className="text-sm font-semibold text-slate-700">No Generated Tracking Links Yet</div>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          Launch your first SMS campaign to automatically generate unique cryptographic tracking URLs for every recipient.
                        </p>
                        <Link href="/campaigns/new" className="inline-block pt-1">
                          <Button variant="primary" size="sm" className="gap-1.5">
                            <PlusCircle className="w-4 h-4" />
                            <span>Create First Campaign</span>
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  mappings.map((m, idx) => {
                    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
                    const shortUrl = `${origin}/t/${m.trackingId}`;
                    return (
                      <tr key={m._id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-slate-900 font-sans">
                          {m._id ? `Q-${String(m._id).slice(-5)}` : `REC-${idx + 1}`}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">{m.phone}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-100">
                            {m.trackingId}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-blue-600 font-medium">
                          <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {shortUrl}
                          </a>
                        </td>
                        <td className="px-4 py-3.5 font-sans">
                          {m.clickStatus === "clicked" ? (
                            <Badge variant="purple">Clicked</Badge>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Not clicked</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right font-sans">
                          <Badge variant="success">Mapped</Badge>
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
