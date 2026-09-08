import React from "react";
import { Card } from "./Card";
import { cn, formatNumber } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: number | string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "positive",
  subtitle,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBg = "bg-blue-50",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("p-5 flex flex-col justify-between hover:shadow-md transition-shadow", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", iconBg, iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-slate-900">
          {typeof value === "number" ? formatNumber(value) : value}
        </div>

        {(change || subtitle) && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs">
            {change && (
              <span
                className={cn(
                  "inline-flex items-center font-medium gap-0.5",
                  changeType === "positive" && "text-emerald-600",
                  changeType === "negative" && "text-rose-600",
                  changeType === "neutral" && "text-slate-500"
                )}
              >
                {changeType === "positive" && <TrendingUp className="w-3.5 h-3.5" />}
                {changeType === "negative" && <TrendingDown className="w-3.5 h-3.5" />}
                {change}
              </span>
            )}
            {subtitle && <span className="text-slate-400">{subtitle}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}
