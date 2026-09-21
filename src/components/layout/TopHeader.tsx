"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Calendar,
  ChevronDown,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  User,
  Settings,
  LogOut,
  Coins,
  Shield,
} from "lucide-react";
import { ThemeToggle } from "../theme/ThemeToggle";

export function TopHeader() {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadUser();
  }, []);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/me", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/login");
    }
  };

  const userInitials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const userRoleDisplay =
    currentUser?.platformRole === "superadmin"
      ? "SuperAdmin"
      : currentUser?.role === "owner"
      ? "Workspace Owner"
      : "Admin";

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs backdrop-blur-md">
      {/* Search Input */}
      <div className="relative w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search campaigns, tracking IDs, contacts..."
          className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/80 focus:bg-white dark:focus:bg-slate-900 text-xs border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Gateway Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>ZendSMS: Active</span>
        </div>

        {/* Theme Switcher Toggle */}
        <ThemeToggle />

        {/* Date Filter Selector */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Last 30 Days</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </div>

        {/* Notifications Icon with popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 bg-blue-600 rounded-full absolute top-2 right-2 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-dropdown border border-slate-200 dark:border-slate-800 p-4 z-50 text-xs">
              <div className="font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center justify-between">
                <span>Notifications</span>
                <span className="text-[10px] text-slate-400">All caught up</span>
              </div>
              <div className="py-6 text-center text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300">No unread notifications</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Campaign dispatches and delivery events will alert here.</div>
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
                {currentUser?.name || "Loading..."}
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
                <div className="font-bold text-slate-900 dark:text-white truncate">{currentUser?.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser?.email}</div>
                
                {/* Status Indicator */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Status:</span>
                  {currentUser?.isPhoneVerified ? (
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

                {currentUser?.platformRole === "superadmin" && (
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
                  onClick={handleLogout}
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
