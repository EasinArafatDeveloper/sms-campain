"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { LogoMark } from "@/components/ui/Logo";
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
  Zap,
  ShieldAlert,
  UserCheck,
  ShieldCheck,
  X,
  Coins,
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
  { label: "My Profile", href: "/profile", icon: UserCheck },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isSuperAdmin = user?.platformRole === "superadmin";

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "US";

  return (
    <aside
      className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col flex-shrink-0 min-h-screen transition-transform duration-300 ease-in-out md:translate-x-0 shadow-lg md:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
          <LogoMark size={36} />
          <div>
            <div className="font-display font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100">
              {BRAND.name}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">{BRAND.tagline}</div>
          </div>
        </Link>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
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
              onClick={onClose}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                    item.badge === "AI"
                      ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50"
                      : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {isSuperAdmin && (
          <div className="pt-3">
            <div className="px-3 pb-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Administration
            </div>
            <Link
              href="/admin"
              onClick={onClose}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all group",
                pathname.startsWith("/admin")
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-amber-900 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100/80 dark:hover:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/50"
              )}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Super Admin</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                MASTER
              </span>
            </Link>
          </div>
        )}
      </div>

      {/* Live Balance Summary Bar */}
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          <span>Credits:</span>
        </div>
        <span
          className={cn(
            "font-bold px-2 py-0.5 rounded text-xs",
            (user?.smsCredits ?? 0) <= 0
              ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60"
              : (user?.smsCredits ?? 0) < 10
              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60"
              : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60"
          )}
        >
          {user?.smsCredits ?? 0}
        </span>
      </div>

      {/* User Profile Footer */}
      <Link
        href="/profile"
        onClick={onClose}
        className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
            {userInitials}
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-slate-900 dark:text-white leading-none truncate max-w-[110px]">
              {user?.name || "My Account"}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 capitalize flex items-center gap-1">
              <span>{user?.platformRole === "superadmin" ? "SuperAdmin" : "Workspace Owner"}</span>
            </div>
          </div>
        </div>
        {user?.isPhoneVerified ? (
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" title="Phone Unverified" />
        )}
      </Link>
    </aside>
  );
}

