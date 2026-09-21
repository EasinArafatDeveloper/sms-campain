import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Sparkles, ArrowRight, TrendingUp, ShieldCheck } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export interface EngagementIntelligenceCardProps {
  highIntentCount?: number;
  uniqueClickers?: number;
  repeatClickers?: number;
  dateRangeLabel?: string;
}

export function EngagementIntelligenceCard({
  highIntentCount = 0,
  uniqueClickers = 0,
  repeatClickers = 0,
  dateRangeLabel = "selected period",
}: EngagementIntelligenceCardProps) {
  const highIntentRatio =
    uniqueClickers > 0 ? Number(((highIntentCount / uniqueClickers) * 100).toFixed(1)) : 0;
  const repeatRate =
    uniqueClickers > 0 ? Number(((repeatClickers / uniqueClickers) * 100).toFixed(1)) : 0;

  return (
    <Card className="flex flex-col justify-between border-purple-100 dark:border-purple-950/60 bg-gradient-to-b from-white to-purple-50/20 dark:from-slate-900 dark:to-purple-950/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <CardTitle className="text-sm">Engagement Intelligence</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-100/80 dark:border-purple-900/40">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatNumber(highIntentCount)}</div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            {highIntentCount > 0 ? (
              <>
                Active buyers recorded with multi-click engagement during <strong>{dateRangeLabel}</strong>.
              </>
            ) : (
              <>
                High-intent leads identified automatically from repeat link clicks during <strong>{dateRangeLabel}</strong>.
              </>
            )}
          </p>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span>High-Intent Ratio</span>
            <span className="font-semibold text-purple-700 dark:text-purple-400">{highIntentRatio}% of Clickers</span>
          </div>
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span>Repeat Click Rate</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{repeatRate}%</span>
          </div>
        </div>

        <Link
          href="/active-leads"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <span>Explore High-Intent Leads</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}

export interface CampaignOptimizationCardProps {
  volumeReductionPercent?: number;
  highIntentCount?: number;
  totalAudience?: number;
}

export function CampaignOptimizationCard({
  volumeReductionPercent = 0,
  highIntentCount = 0,
  totalAudience = 0,
}: CampaignOptimizationCardProps) {
  const dynamicSavingsText =
    volumeReductionPercent > 0
      ? `Reduce SMS messaging costs by up to ${volumeReductionPercent}% by focusing spend solely on validated high-intent buyers.`
      : "Broadcast trackable SMS campaigns to uncover high-intent buyers and optimize future budget efficiency.";

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white border-0 shadow-lg relative overflow-hidden">
      <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-200 border border-blue-400/30">
            <Sparkles className="w-3 h-3 text-blue-300" />
            <span>Budget Optimization Opportunity</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white">
            {volumeReductionPercent > 0
              ? `Optimize Messaging Budget: Save ${volumeReductionPercent}% with Smart Retargeting`
              : "Smart Behavioral Retargeting & Budget Optimization"}
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            {highIntentCount > 0 && totalAudience > 0 ? (
              <>
                Your audience has {formatNumber(totalAudience)} contacts. By targeting the{" "}
                <strong className="text-white">{formatNumber(highIntentCount)} repeatedly engaged leads</strong>, you can
                drastically reduce dispatch costs while maximizing conversions.
              </>
            ) : (
              <>{dynamicSavingsText}</>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/campaigns/new?source=retargeting&audience=highly_active"
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-md transition-all inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <span>Create Retargeting Campaign</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}


