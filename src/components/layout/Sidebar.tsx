"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
  ShieldAlert,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Grouped so the list reads as a few short sections instead of eleven equal rows. */
const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
  { label: null, items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  {
    label: "Send",
    items: [
      { label: "Campaigns", href: "/campaigns", icon: Send },
      { label: "Tracking Links", href: "/link-generator", icon: Link2 },
      { label: "Delivery Queue", href: "/delivery-queue", icon: ListOrdered },
    ],
  },
  {
    label: "Results",
    items: [
      { label: "Click Analytics", href: "/click-analytics", icon: BarChart3 },
      { label: "Active Leads", href: "/active-leads", icon: Users },
      { label: "Reports", href: "/reports", icon: FileText },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Audiences", href: "/audiences", icon: Target },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
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
    : "U";

  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white shadow-lg transition-transform duration-300 ease-in-out dark:border-white/10 dark:bg-slate-900 md:static md:min-h-screen md:translate-x-0 md:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5 dark:border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
          <LogoMark size={34} />
          <div className="font-display text-base font-extrabold tracking-tight text-slate-900 dark:text-white">{BRAND.name}</div>
        </Link>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200 md:hidden"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Primary action */}
      <div className="px-4 pt-4">
        <Link
          href="/campaigns/new"
          onClick={onClose}
          className="group relative flex h-11 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
        >
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent motion-safe:animate-shimmer" />
          <PlusCircle className="relative h-4 w-4" aria-hidden="true" />
          <span className="relative">New campaign</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav aria-label="Main" className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                        active ? "text-indigo-700 dark:text-indigo-300" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-xl bg-indigo-50 dark:bg-indigo-500/15"
                          transition={{ type: "spring", stiffness: 420, damping: 36 }}
                        />
                      )}
                      {active && <span aria-hidden="true" className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b from-indigo-500 to-cyan-400" />}
                      <Icon className={cn("relative h-[18px] w-[18px]", active ? "text-indigo-600 dark:text-indigo-300" : "text-slate-400")} aria-hidden="true" />
                      <span className="relative">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {isSuperAdmin && (
          <div>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Admin</p>
            <Link
              href="/admin"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-amber-500 text-white shadow-sm"
                  : "border border-amber-200/70 bg-amber-50/70 text-amber-900 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
              )}
            >
              <ShieldAlert className="h-[18px] w-[18px]" aria-hidden="true" />
              Super Admin
            </Link>
          </div>
        )}
      </nav>

      {/* Account */}
      <Link
        href="/profile"
        onClick={onClose}
        className="group flex items-center justify-between border-t border-slate-100 p-3 transition-colors hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-xs font-bold text-white transition-transform group-hover:scale-105">
            {userInitials}
          </span>
          <div className="min-w-0 text-left leading-tight">
            <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.name || "My account"}</div>
            <div className="text-xs text-slate-400">{isSuperAdmin ? "Super admin" : "Profile"}</div>
          </div>
        </div>
        {user?.isPhoneVerified ? (
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" aria-label="Phone verified" />
        ) : user ? (
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-500" title="Phone not verified" />
        ) : null}
      </Link>
    </aside>
  );
}
