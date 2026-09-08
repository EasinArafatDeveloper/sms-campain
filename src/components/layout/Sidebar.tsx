"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Send,
  PlusCircle,
  Link2,
  ListOrdered,
  BarChart3,
  Users,
  Target,
  FileText,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Campaigns", href: "/campaigns", icon: Send },
  { label: "Create Campaign", href: "/campaigns/new", icon: PlusCircle, badge: "New" },
  { label: "Link Generator", href: "/link-generator", icon: Link2 },
  { label: "Delivery Queue", href: "/delivery-queue", icon: ListOrdered },
  { label: "Click Analytics", href: "/click-analytics", icon: BarChart3 },
  { label: "Active Leads", href: "/active-leads", icon: Users, badge: "AI" },
  { label: "Audience Segments", href: "/audiences", icon: Target },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col flex-shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
            SMSPro
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 bg-blue-50 text-blue-600 rounded border border-blue-100">
              SaaS
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Customer Engagement</div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Main Navigation
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                    item.badge === "AI"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Smart Retargeting Card */}
      <div className="p-3 m-3 rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-100/80">
        <div className="flex items-center gap-2 text-blue-800 font-semibold text-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Smart Retargeting</span>
        </div>
        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
          AI tracks multi-click engagement to surface high-intent buyers automatically.
        </p>
        <Link
          href="/active-leads"
          className="mt-2.5 block text-center py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          View Active Leads
        </Link>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            OS
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-slate-900 leading-none">Omer Sharif</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Marketing Manager</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
