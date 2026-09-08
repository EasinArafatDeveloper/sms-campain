import React from "react";
import { formatNumber } from "@/lib/utils";

export interface FunnelStage {
  label: string;
  count: number;
  percent: number;
  color?: string;
}

export interface FunnelChartProps {
  stages: FunnelStage[];
  title?: string;
}

export function FunnelChart({ stages, title }: FunnelChartProps) {
  const maxCount = stages.length > 0 ? stages[0].count : 1;

  return (
    <div className="space-y-4">
      {title && <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h4>}
      <div className="space-y-3">
        {stages.map((stage, idx) => {
          const widthPercent = Math.max(12, Math.round((stage.count / maxCount) * 100));
          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">{stage.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{formatNumber(stage.count)}</span>
                  <span className="text-slate-400">({stage.percent}%)</span>
                </div>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: stage.color || "#2563EB",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
