"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  Bell,
  Menu,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  User,
  Settings,
  LogOut,
  Coins,
  Shield,
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { ThemeToggle } from "../theme/ThemeToggle";
import { cn } from "@/lib/utils";

interface TopHeaderProps {
  onToggleMobileNav?: () => void;
}

export function TopHeader({ onToggleMobileNav }: TopHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch live notifications
  const loadNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/campaigns?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const userRoleDisplay =
    user?.platformRole === "superadmin"
      ? "SuperAdmin"
      : user?.role === "owner"
      ? "Workspace Owner"
      : "Admin";

  const smsCredits = user?.smsCredits ?? 0;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs backdrop-blur-md">
      {/* Left Area: Mobile Hamburger + Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileNav}
          className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Form */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns, tracking IDs... (Enter)"
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/80 focus:bg-white dark:focus:bg-slate-900 text-xs border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
        </form>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live SMS Credit Wallet Badge */}
        <Link
          href={user?.platformRole === "superadmin" ? "/admin" : "/profile"}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs",
            smsCredits <= 0
              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-100/80"
              : smsCredits < 10
              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100/80"
              : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100/80"
          )}
          title={`Available SMS Balance: ${smsCredits} credits`}
        >
          <Coins className="w-3.5 h-3.5 shrink-0 text-amber-500" />
          <span className="tabular-nums">{smsCredits}</span>
          <span className="hidden sm:inline">Credits</span>
        </Link>

        {/* Theme Switcher Toggle */}
        <ThemeToggle />

        {/* Dynamic Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) loadNotifications();
            }}
            className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors relative cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="min-w-[16px] h-4 px-1 bg-rose-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center absolute -top-1 -right-1 ring-2 ring-white dark:ring-slate-900 animate-in zoom-in">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-dropdown border border-slate-200 dark:border-slate-800 p-4 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="font-semibold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold">
                  <span>System Alerts & Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </span>
                <button
                  onClick={loadNotifications}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Refresh
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto py-2 space-y-2">
                {isLoadingNotifications ? (
                  <div className="py-6 text-center text-slate-400">Loading alerts...</div>
                ) : notifications.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">All caught up!</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      No pending warnings, system alerts, or failed campaign events.
                    </div>
                  </div>
                ) : (
                  notifications.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className={cn(
                        "p-3 rounded-xl border transition-all text-left flex items-start gap-2.5",
                        item.type === "error"
                          ? "bg-rose-50/70 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/60 text-rose-900 dark:text-rose-200"
                          : item.type === "warning"
                          ? "bg-amber-50/70 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/60 text-amber-900 dark:text-amber-200"
                          : "bg-blue-50/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/60 text-slate-800 dark:text-slate-200"
                      )}
                    >
                      {item.type === "error" ? (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      ) : item.type === "warning" ? (
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs leading-tight flex items-center justify-between">
                          <span>{item.title}</span>
                        </div>
                        <p className="text-[11px] opacity-90 mt-1 leading-snug">{item.message}</p>
                        {item.link && (
                          <Link
                            href={item.link}
                            onClick={() => setShowNotifications(false)}
                            className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <span>Take Action</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Interactive Badge & Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800 py-1 hover:opacity-80 transition-opacity cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {userInitials}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-none truncate max-w-[130px]">
                {user?.name || "Loading..."}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 capitalize">
                {userRoleDisplay}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-dropdown border border-slate-200 dark:border-slate-800 p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              {/* User Summary Header */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-2">
                <div className="font-bold text-slate-900 dark:text-white truncate">{user?.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>

                {/* Status Indicator */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Status:</span>
                  {user?.isPhoneVerified ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Phone Verified
                    </span>
                  ) : (
                    <Link
                      href="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200/80"
                    >
                      <ShieldAlert className="w-3 h-3" /> Verify Phone (+50 Credits)
                    </Link>
                  )}
                </div>
              </div>

              {/* Menu Links */}
              <div className="space-y-0.5 py-1 text-slate-700 dark:text-slate-300">
                <Link
                  href="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
                >
                  <User className="w-4 h-4 text-blue-600" />
                  <span>My Profile & Phone OTP</span>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Workspace Settings</span>
                </Link>

                {user?.platformRole === "superadmin" && (
                  <Link
                    href="/admin"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-400 font-semibold transition-colors"
                  >
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span>Super Admin Panel</span>
                  </Link>
                )}
              </div>

              {/* Sign Out Button */}
              <div className="pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

