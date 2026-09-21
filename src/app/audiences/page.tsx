"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, PageHeader, Panel, btnPrimary, btnSecondary } from "@/components/ui/page";
import { TextField } from "@/components/auth/fields";
import { Download, Loader2, PlusCircle, Send, Target, X } from "lucide-react";
import { formatNumber } from "@/lib/utils";

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
  const nameRef = useRef<HTMLInputElement>(null);

  const fetchSegments = async () => {
    try {
      const res = await fetch("/api/audiences");
      setSegments(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  useEffect(() => {
    if (!showCreateModal) return;
    nameRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowCreateModal(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showCreateModal]);

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
          description: newSegmentDesc || `Clicked in ${minCampaigns}+ campaigns, ${minClicks}+ clicks, in the last ${withinDays} days`,
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

  const NewButton = (
    <button type="button" onClick={() => setShowCreateModal(true)} className={btnPrimary}>
      <PlusCircle className="h-4 w-4" aria-hidden="true" />
      New audience
    </button>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Audiences"
          subtitle="Groups of people picked by how they clicked. Send them a follow-up in one click."
          actions={segments.length > 0 ? NewButton : undefined}
        />

        {segments.length === 0 ? (
          <Panel>
            <EmptyState
              icon={Target}
              title="No audiences yet"
              body="Make a group such as “clicked in 3 campaigns in the last 30 days”, then send that group a new campaign."
              action={NewButton}
            />
          </Panel>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {segments.map((seg) => (
              <div key={seg._id} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-slate-900">
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-purple-500/25">
                      <Target className="h-5 w-5" aria-hidden="true" />
                    </span>
                    {seg.isSystem && <Badge variant="purple">Built in</Badge>}
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-slate-900 dark:text-white">{seg.name}</h3>
                  <p className="mt-1 min-h-[40px] text-sm text-slate-500 dark:text-slate-400">{seg.description}</p>
                  <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                    <strong className="font-display text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">{formatNumber(seg.estimatedCount || 0)}</strong>{" "}
                    people
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 p-3 dark:border-white/10 dark:bg-white/[0.02]">
                  <a href="/api/exports/leads" download className={`${btnSecondary} !h-9 !px-3 !text-xs`}>
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    Export
                  </a>
                  <Link href={`/campaigns/new?source=retargeting&segmentId=${seg._id}`} className={`${btnPrimary} !h-9 !px-3 !text-xs`}>
                    <Send className="h-3.5 w-3.5" aria-hidden="true" />
                    Send campaign
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-audience-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 id="new-audience-title" className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  New audience
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">People who match all three rules are included.</p>
              </div>
              <button type="button" onClick={() => setShowCreateModal(false)} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSegment} className="mt-6 space-y-4">
              <TextField ref={nameRef} label="Name" required value={newSegmentName} onChange={(e) => setNewSegmentName(e.target.value)} placeholder="e.g. September repeat clickers" />
              <TextField label="Description (optional)" value={newSegmentDesc} onChange={(e) => setNewSegmentDesc(e.target.value)} placeholder="A short note for your team" />

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Rules</p>
                <div className="grid grid-cols-3 gap-3">
                  <TextField label="Campaigns clicked" type="number" min={1} max={10} value={minCampaigns} onChange={(e) => setMinCampaigns(parseInt(e.target.value, 10) || 1)} hint="At least" />
                  <TextField label="Total clicks" type="number" min={1} max={20} value={minClicks} onChange={(e) => setMinClicks(parseInt(e.target.value, 10) || 1)} hint="At least" />
                  <TextField label="Last click (days)" type="number" min={7} max={90} value={withinDays} onChange={(e) => setWithinDays(parseInt(e.target.value, 10) || 30)} hint="Within" />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className={btnSecondary}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className={btnPrimary}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  Save audience
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
