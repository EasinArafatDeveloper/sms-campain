"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ShieldAlert,
  Users,
  Building2,
  Send,
  MousePointerClick,
  Coins,
  Search,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Equal,
  Lock,
  Unlock,
  Crown,
  AlertTriangle,
  RefreshCw,
  Clock,
  Activity,
  FileSpreadsheet,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<"directory" | "telemetry" | "audit">("directory");
  const [stats, setStats] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Credit top-up modal state
  const [creditModalOrg, setCreditModalOrg] = useState<any>(null);
  const [creditAction, setCreditAction] = useState<"add" | "deduct" | "set">("add");
  const [creditAmount, setCreditAmount] = useState<number>(100);
  const [creditReason, setCreditReason] = useState<string>("Manual Admin Adjustment");
  const [isUpdatingCredit, setIsUpdatingCredit] = useState<boolean>(false);

  // Action Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    isDanger?: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "",
    onConfirm: async () => {},
  });
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);

  // 1. Debounce Search Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // 2. Fetch Current User
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchMe();
  }, []);

  // 3. Load Admin Data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch(`/api/admin/users?search=${encodeURIComponent(debouncedSearch)}&page=${page}&limit=${limit}`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
        setTotal(usersData.total || 0);
        setTotalPages(usersData.totalPages || 1);
      }
    } catch (err: any) {
      console.error("Failed to load admin data:", err);
      setNotification({ type: "error", message: err.message || "Failed to fetch platform metrics" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [debouncedSearch, page, limit]);

  // 4. Fetch Audit Logs
  const fetchAuditLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const res = await fetch("/api/admin/audit-logs?limit=40");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [activeTab]);

  // Trigger User Status Change with Confirmation
  const promptToggleStatus = (user: any) => {
    if (user._id === currentUser?.id) {
      setNotification({ type: "error", message: "Self-action blocked: You cannot suspend your own account." });
      return;
    }

    const newStatus = user.status === "active" ? "disabled" : "active";
    setConfirmModal({
      isOpen: true,
      title: `${newStatus === "disabled" ? "Suspend" : "Reactivate"} User Account`,
      description: `Are you sure you want to ${
        newStatus === "disabled" ? "suspend" : "reactivate"
      } the account for ${user.name} (${user.email})?`,
      confirmText: newStatus === "disabled" ? "Yes, Suspend Account" : "Yes, Reactivate",
      isDanger: newStatus === "disabled",
      onConfirm: async () => {
        try {
          setIsProcessingAction(true);
          const res = await fetch("/api/admin/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user._id, status: newStatus }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Action failed");

          setNotification({
            type: "success",
            message: `User ${user.name} has been ${newStatus === "disabled" ? "suspended" : "activated"}.`,
          });
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          loadData();
        } catch (err: any) {
          setNotification({ type: "error", message: err.message });
        } finally {
          setIsProcessingAction(false);
        }
      },
    });
  };

  // Trigger Workspace Status Change
  const promptToggleWorkspaceStatus = (user: any) => {
    if (!user.organization?._id) return;
    const org = user.organization;
    const newStatus = org.status === "active" ? "suspended" : "active";

    setConfirmModal({
      isOpen: true,
      title: `${newStatus === "suspended" ? "Suspend" : "Unsuspend"} Workspace`,
      description: `Are you sure you want to ${
        newStatus === "suspended" ? "suspend" : "unsuspend"
      } the entire workspace "${org.name}"? Active campaigns for this organization will be paused.`,
      confirmText: newStatus === "suspended" ? "Yes, Suspend Workspace" : "Yes, Unsuspend",
      isDanger: newStatus === "suspended",
      onConfirm: async () => {
        try {
          setIsProcessingAction(true);
          const res = await fetch("/api/admin/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ organizationId: org._id, workspaceStatus: newStatus }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Action failed");

          setNotification({
            type: "success",
            message: `Workspace "${org.name}" has been ${newStatus === "suspended" ? "suspended" : "unsuspended"}.`,
          });
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          loadData();
        } catch (err: any) {
          setNotification({ type: "error", message: err.message });
        } finally {
          setIsProcessingAction(false);
        }
      },
    });
  };

  // Trigger SuperAdmin Role Change with Confirmation
  const promptToggleSuperAdmin = (user: any) => {
    if (user._id === currentUser?.id) {
      setNotification({
        type: "error",
        message: "Self-action blocked: You cannot revoke SuperAdmin privileges from your own account.",
      });
      return;
    }

    const newRole = user.platformRole === "superadmin" ? "user" : "superadmin";
    setConfirmModal({
      isOpen: true,
      title: `${newRole === "superadmin" ? "Grant" : "Revoke"} SuperAdmin Access`,
      description: `Are you sure you want to ${
        newRole === "superadmin" ? "grant full platform SuperAdmin privileges to" : "revoke SuperAdmin privileges from"
      } ${user.name} (${user.email})?`,
      confirmText: newRole === "superadmin" ? "Yes, Grant SuperAdmin" : "Yes, Revoke Access",
      isDanger: newRole === "user",
      onConfirm: async () => {
        try {
          setIsProcessingAction(true);
          const res = await fetch("/api/admin/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user._id, platformRole: newRole }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Action failed");

          setNotification({
            type: "success",
            message: `SuperAdmin role for ${user.name} was ${newRole === "superadmin" ? "granted" : "revoked"}.`,
          });
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          loadData();
        } catch (err: any) {
          setNotification({ type: "error", message: err.message });
        } finally {
          setIsProcessingAction(false);
        }
      },
    });
  };

  // Handle Credit Adjustment (Add, Deduct, Set)
  const handleUpdateCredits = async () => {
    if (!creditModalOrg?._id) return;
    if (creditAmount < 0) {
      setNotification({ type: "error", message: "Credit amount must be greater than or equal to 0" });
      return;
    }

    setIsUpdatingCredit(true);
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: creditModalOrg._id,
          amount: Number(creditAmount),
          action: creditAction,
          reason: creditReason.trim() || "Manual Admin Adjustment",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update credits");

      setNotification({
        type: "success",
        message: `Successfully updated credits for "${creditModalOrg.name}". New balance: ${data.smsCredits} SMS.`,
      });
      setCreditModalOrg(null);
      loadData();
    } catch (err: any) {
      setNotification({ type: "error", message: err.message });
    } finally {
      setIsUpdatingCredit(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center justify-between transition-all ${
              notification.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2.5 font-medium">
              {notification.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 text-[11px] font-bold underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <span>Super Admin Platform Portal</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-bold border border-blue-500/30">
                  MASTER PLATFORM
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized management for all SaaS tenants, user permissions, credit ledgers, and live gateway telemetry.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700 text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Metrics</span>
            </Button>
          </div>
        </div>

        {/* Global SaaS KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Tenants</span>
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
                {formatNumber(stats?.totalTenants || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Total Users</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
                {formatNumber(stats?.totalUsers || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Campaigns</span>
                <Send className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
                {formatNumber(stats?.totalCampaigns || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">SMS Sent</span>
                <Send className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
                {formatNumber(stats?.totalSmsSent || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Human Clicks</span>
                <MousePointerClick className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
                {formatNumber(stats?.totalClicks || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white border-slate-800 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">ZendSMS Balance</span>
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-lg font-bold text-amber-400 mt-2 font-mono truncate">
                {stats?.gatewayBalance !== null && typeof stats?.gatewayBalance !== "undefined" ? (
                  `৳${formatNumber(stats.gatewayBalance)} ${stats.gatewayCurrency || "BDT"}`
                ) : (
                  <span className="text-xs text-slate-400 font-normal">Offline / Check Key</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("directory")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "directory"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users & Tenants Directory</span>
          </button>

          <button
            onClick={() => setActiveTab("telemetry")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "telemetry"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Platform Telemetry & Gateway</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "audit"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>SuperAdmin Audit Logs</span>
          </button>
        </div>

        {/* TAB 1: Users & Tenants Directory */}
        {activeTab === "directory" && (
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <CardTitle className="text-base font-bold">
                  Platform Users & Tenants ({total})
                </CardTitle>
                <CardDescription className="text-xs">
                  Manage credit quotas, adjust permissions, or suspend workspaces
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, email, phone..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Phone & OTP</th>
                      <th className="py-3 px-4">Workspace</th>
                      <th className="py-3 px-4">SMS Credits</th>
                      <th className="py-3 px-4">Activity</th>
                      <th className="py-3 px-4">Platform Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                          <span>Loading platform users...</span>
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No users or tenants found matching your query.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => {
                        const isSelf = u._id === currentUser?.id;
                        return (
                          <tr key={u._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-slate-900 dark:text-white">{u.name}</div>
                                {isSelf && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded font-bold">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">{u.email}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-mono text-slate-700 dark:text-slate-300">{u.phone || "—"}</div>
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded-full mt-0.5 ${
                                  u.isPhoneVerified
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {u.isPhoneVerified ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                <span>{u.isPhoneVerified ? "Verified" : "Unverified"}</span>
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <div className="font-medium text-slate-800 dark:text-slate-200">
                                  {u.organization?.name || "No Workspace"}
                                </div>
                                {u.organization && (
                                  <button
                                    type="button"
                                    onClick={() => promptToggleWorkspaceStatus(u)}
                                    title="Toggle Workspace Status"
                                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase transition-colors ${
                                      u.organization?.status === "suspended"
                                        ? "bg-rose-100 text-rose-800 hover:bg-rose-200"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                  >
                                    {u.organization?.status || "Active"}
                                  </button>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                /{u.organization?.slug || "—"}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-mono font-bold px-2 py-0.5 rounded border text-xs ${
                                    (u.organization?.smsCredits ?? 0) < 10
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                  }`}
                                >
                                  {formatNumber(u.organization?.smsCredits ?? 0)}
                                </span>
                                {u.organization && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCreditModalOrg(u.organization);
                                      setCreditAmount(100);
                                      setCreditAction("add");
                                      setCreditReason("Manual Admin Top-up");
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded transition-colors"
                                    title="Manage Credits (Add / Deduct / Set)"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                              <div>{u.stats?.campaignCount || 0} campaigns</div>
                              <div className="text-[10px] text-slate-400">
                                {formatNumber(u.stats?.smsSent || 0)} SMS sent
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  u.platformRole === "superadmin"
                                    ? "bg-amber-50 text-amber-800 border border-amber-300 shadow-xs"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                {u.platformRole === "superadmin" && <Crown className="w-3 h-3 text-amber-600" />}
                                <span>{u.platformRole === "superadmin" ? "SUPERADMIN" : "USER"}</span>
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <Badge
                                variant={u.status === "active" ? "success" : "danger"}
                                className="capitalize font-semibold text-[10px]"
                              >
                                {u.status}
                              </Badge>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Suspend / Activate User Button */}
                                <button
                                  type="button"
                                  disabled={isSelf}
                                  onClick={() => promptToggleStatus(u)}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    isSelf
                                      ? "opacity-30 cursor-not-allowed border-slate-200 text-slate-400"
                                      : u.status === "active"
                                      ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                  }`}
                                  title={
                                    isSelf
                                      ? "Cannot suspend self"
                                      : u.status === "active"
                                      ? "Suspend User"
                                      : "Reactivate User"
                                  }
                                >
                                  {u.status === "active" ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                </button>

                                {/* Toggle SuperAdmin Role Button */}
                                <button
                                  type="button"
                                  disabled={isSelf}
                                  onClick={() => promptToggleSuperAdmin(u)}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    isSelf
                                      ? "opacity-30 cursor-not-allowed border-slate-200 text-slate-400"
                                      : u.platformRole === "superadmin"
                                      ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                                      : "border-slate-200 text-slate-500 hover:bg-slate-100"
                                  }`}
                                  title={
                                    isSelf
                                      ? "Cannot revoke self"
                                      : u.platformRole === "superadmin"
                                      ? "Revoke SuperAdmin"
                                      : "Grant SuperAdmin"
                                  }
                                >
                                  <Crown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>

            {/* Pagination Controls */}
            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 py-4">
              <div className="text-xs text-slate-500">
                Showing {users.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
                {Math.min(page * limit, total)} of {total} registered users
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-2">
                  <span className="text-xs text-slate-500">Rows:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </Button>

                <span className="text-xs font-semibold px-2 text-slate-700 dark:text-slate-300">
                  Page {page} of {totalPages || 1}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="gap-1 text-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* TAB 2: Platform Telemetry & Gateway Health */}
        {activeTab === "telemetry" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Platform Delivery Telemetry</span>
                </CardTitle>
                <CardDescription className="text-xs">Live aggregated transmission statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Global Delivery Success Rate</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {stats?.deliverySuccessRate || 100}%
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Delivered / Successful SMS</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    {formatNumber(stats?.totalSmsDelivered || stats?.totalSmsSent || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Failed / Undelivered SMS</span>
                  <span className="font-bold font-mono text-rose-600">
                    {formatNumber(stats?.totalSmsFailed || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Recent Signups (Last 7 Days)</span>
                  <span className="font-bold text-blue-600">{stats?.recentSignups || 0} new accounts</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Human Click Attribution Ratio</span>
                  <span className="font-bold text-purple-600">
                    {stats?.totalSmsSent > 0
                      ? `${(((stats?.totalClicks || 0) / stats.totalSmsSent) * 100).toFixed(1)}%`
                      : "0.0%"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>Central ZendSMS Gateway Health</span>
                </CardTitle>
                <CardDescription className="text-xs">Primary shared gateway status & balance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Gateway Provider</span>
                  <span className="font-bold text-slate-900 dark:text-white">ZendSMS Bangladesh (app.zendsms.com)</span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Gateway Status</span>
                  {stats?.gatewayHealthy ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Operational
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="gap-1">
                      <AlertTriangle className="w-3 h-3" /> Check Connection / Key
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Live Gateway Balance</span>
                  <span className="font-bold font-mono text-amber-600 text-sm">
                    {stats?.gatewayBalance !== null && typeof stats?.gatewayBalance !== "undefined"
                      ? `৳${formatNumber(stats.gatewayBalance)} ${stats.gatewayCurrency || "BDT"}`
                      : "Unavailable"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Approved Master Sender ID</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">8809612781020</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: SuperAdmin Audit Logs */}
        {activeTab === "audit" && (
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>SuperAdmin Action Audit Trail</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Immutable ledger of administrative actions, status updates, and credit adjustments
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchAuditLogs} className="gap-1.5 text-xs">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Logs</span>
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Admin</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Target Organization / User</th>
                      <th className="py-3 px-4">Details / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {isLoadingLogs ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 font-sans">
                          Loading audit trail...
                        </td>
                      </tr>
                    ) : auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 font-sans">
                          No audit entries recorded yet.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {log.createdAt ? formatDate(log.createdAt) : "—"}
                          </td>
                          <td className="py-3 px-4 text-slate-900 dark:text-white font-sans font-semibold">
                            {log.userName}
                            <div className="text-[10px] text-slate-400 font-mono">{log.userEmail}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[10px] border border-blue-200/60">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-sans">
                            {log.organizationName}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-[11px] font-sans">
                            {log.metadata?.reason ? (
                              <span className="italic font-medium text-slate-800 dark:text-slate-200">
                                "{log.metadata.reason}"
                              </span>
                            ) : null}
                            {typeof log.metadata?.amount !== "undefined" && (
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                Delta: {log.metadata.action === "deduct" ? "-" : "+"}
                                {log.metadata.amount} | Prev: {log.metadata.previousCredits} → New:{" "}
                                {log.metadata.newCredits}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CREDIT ADJUSTMENT MODAL */}
        {creditModalOrg && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
            <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Manage SMS Quota</CardTitle>
                    <CardDescription className="text-xs">
                      Workspace: <strong className="text-slate-900 dark:text-white">{creditModalOrg.name}</strong>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-5 text-xs">
                {/* Current balance indicator */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-500">Current Balance:</span>
                  <span className="text-sm font-bold text-blue-600 font-mono">
                    {formatNumber(creditModalOrg.smsCredits ?? 0)} Credits
                  </span>
                </div>

                {/* Action Type Selector */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Action Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCreditAction("add")}
                      className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                        creditAction === "add"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add (+)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCreditAction("deduct")}
                      className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                        creditAction === "deduct"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>Deduct (-)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCreditAction("set")}
                      className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                        creditAction === "set"
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      <Equal className="w-3.5 h-3.5" />
                      <span>Set Exact (=)</span>
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {creditAction === "set" ? "New Exact Credit Balance" : "Credit Amount"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                {/* Reason & Audit Note */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Reason / Audit Note
                  </label>
                  <input
                    type="text"
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    placeholder="e.g. Plan purchase, promotion, manual correction..."
                    className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {["Plan Purchase", "Bonus Promo", "Refund Correction", "Support Ticket"].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setCreditReason(chip)}
                        className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded hover:bg-slate-200 transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="justify-end gap-2 border-t border-slate-100 dark:border-slate-800 py-3.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreditModalOrg(null)}
                  disabled={isUpdatingCredit}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleUpdateCredits}
                  isLoading={isUpdatingCredit}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Save Credit Adjustment
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* ACTION CONFIRMATION MODAL */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
            <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      confirmModal.isDanger
                        ? "bg-rose-50 dark:bg-rose-950 text-rose-600"
                        : "bg-blue-50 dark:bg-blue-950 text-blue-600"
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">{confirmModal.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="text-xs text-slate-600 dark:text-slate-300">
                <p className="leading-relaxed">{confirmModal.description}</p>
              </CardContent>

              <CardFooter className="justify-end gap-2 border-t border-slate-100 dark:border-slate-800 py-3.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                  disabled={isProcessingAction}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={confirmModal.onConfirm}
                  isLoading={isProcessingAction}
                  className={
                    confirmModal.isDanger
                      ? "bg-rose-600 hover:bg-rose-700 text-white font-bold"
                      : "bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  }
                >
                  {confirmModal.confirmText}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
