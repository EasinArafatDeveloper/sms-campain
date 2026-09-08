"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Target,
  PlusCircle,
  Sparkles,
  Download,
  Send,
  Trash2,
  CheckCircle2,
  Layers,
  ArrowRight,
} from "lucide-react";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { formatNumber, formatDate } from "@/lib/utils";

export default function AudienceSegmentsPage() {
  const [segments, setSegments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState("");
  const [newSegmentDesc, setNewSegmentDesc] = useState("");
  const [minCampaigns, setMinCampaigns] = useState(3);
  const [minClicks, setMinClicks] = useState(2);
  const [withinDays, setWithinDays] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSegments = async () => {
    try {
      const res = await fetch("/api/audiences");
      const json = await res.json();
      setSegments(json);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  if (isLoading) {
    return (
      <AppLayout>
        <CardGridSkeleton count={3} />
      </AppLayout>
    );
  }

  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSegmentName) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/audiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSegmentName,
          description: newSegmentDesc || `Campaigns >= ${minCampaigns}, Clicks >= ${minClicks}, Days <= ${withinDays}`,
          rules: [
            { field: "campaignsClicked", operator: "gte", value: minCampaigns },
            { field: "totalClicks", operator: "gte", value: minClicks },
            { field: "lastClickWithinDays", operator: "lte", value: withinDays },
          ],
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewSegmentName("");
        setNewSegmentDesc("");
        fetchSegments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const listToRender = segments;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Audience Segments & Rules</h1>
            <p className="text-xs text-slate-500 mt-1">
              Create composable behavioral segments based on historical click and delivery signals.
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} variant="primary" size="md" className="gap-2">
            <PlusCircle className="w-4 h-4" />
            <span>Create Audience Segment</span>
          </Button>
        </div>

        {/* Segments Grid */}
        {listToRender.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <Target className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-semibold text-slate-700">No Audience Segments Found</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Create custom behavioral segments by defining rules such as minimum campaigns clicked, total click counts, and recency windows.
            </p>
            <Button onClick={() => setShowCreateModal(true)} variant="primary" size="sm" className="mt-2 gap-1.5">
              <PlusCircle className="w-4 h-4" />
              <span>Create First Segment</span>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {listToRender.map((seg) => (
              <Card key={seg._id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-600" />
                      <CardTitle className="text-sm">{seg.name}</CardTitle>
                    </div>
                    {seg.isSystem && (
                      <Badge variant="purple" className="text-[10px]">
                        Smart Rule
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">{seg.description}</p>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Estimated Audience</span>
                    <strong className="text-base font-bold text-slate-900">
                      {formatNumber(seg.estimatedCount || 0)} users
                    </strong>
                  </div>
                </CardContent>
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 rounded-b-xl flex items-center justify-between gap-2">
                  <a href="/api/exports/leads" download>
                    <Button variant="outline" size="sm" className="text-xs gap-1">
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </Button>
                  </a>
                  <Link href={`/campaigns/new?source=retargeting&segmentId=${seg._id}`}>
                    <Button variant="primary" size="sm" className="text-xs gap-1 bg-blue-600 hover:bg-blue-700">
                      <Send className="w-3.5 h-3.5" />
                      Launch Campaign
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Segment Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="text-base font-bold text-slate-900">Create Composable Audience Segment</h3>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSegment} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Segment Name</label>
                  <input
                    type="text"
                    required
                    value={newSegmentName}
                    onChange={(e) => setNewSegmentName(e.target.value)}
                    placeholder="e.g. September High Intent VIPs"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    value={newSegmentDesc}
                    onChange={(e) => setNewSegmentDesc(e.target.value)}
                    placeholder="e.g. Users with repeated clicks across 3 campaigns"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div className="font-semibold text-slate-800">Composable Behavioral Rules</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Min Campaigns Clicked</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={minCampaigns}
                        onChange={(e) => setMinCampaigns(parseInt(e.target.value, 10))}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Min Total Clicks</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={minClicks}
                        onChange={(e) => setMinClicks(parseInt(e.target.value, 10))}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Recency (Days)</label>
                      <input
                        type="number"
                        min="7"
                        max="90"
                        value={withinDays}
                        onChange={(e) => setWithinDays(parseInt(e.target.value, 10))}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isLoading={isSubmitting}>
                    Save Audience Segment
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
