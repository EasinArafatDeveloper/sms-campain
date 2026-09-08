import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "danger" | "purple" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-blue-50 text-blue-700 border-blue-200",
    secondary: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    outline: "bg-transparent text-slate-700 border-slate-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = status.toLowerCase();

  if (s === "delivered" || s === "completed" || s === "active" || s === "operational" || s === "highly_active" || s === "high intent") {
    return (
      <Badge variant="success" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  }

  if (s === "sent" || s === "clicked" || s === "engaged") {
    return (
      <Badge variant="default" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  }

  if (s === "queued" || s === "pending_retry" || s === "retrying" || s === "draft" || s === "degraded") {
    return (
      <Badge variant="warning" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  }

  if (s === "failed" || s === "down" || s === "suspended" || s === "invalid") {
    return (
      <Badge variant="danger" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={className}>
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      {status.replace("_", " ").toUpperCase()}
    </Badge>
  );
}
