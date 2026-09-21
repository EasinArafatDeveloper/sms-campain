"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
  Lock,
  Unlock,
  Crown,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default function SuperAdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Credit top-up modal state
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState<number>(100);
  const [isUpdatingCredit, setIsUpdatingCredit] = useState<boolean>(false);

  const loadData = async (query = search) => {
    try {
      setIsLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch(`/api/admin/users?search=${encodeURIComponent(query)}`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
        setTotal(usersData.total || 0);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "disabled" : "active";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSuperAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "superadmin" ? "user" : "superadmin";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, platformRole: newRole }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCredits = async () => {
    if (!selectedOrg?._id || creditAmount <= 0) return;
    setIsUpdatingCredit(true);
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: selectedOrg._id, amount: Number(creditAmount), action: "add" }),
      });
      if (res.ok) {
        setSelectedOrg(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingCredit(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <span>Super Admin Portal</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono font-semibold border border-blue-500/30">
                  MASTER PLATFORM
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Manage all SaaS tenants, user accounts, SMS credit quotas, and global platform health
              </p>
            </div>
          </div>
        </div>

        {/* Global SaaS KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <Card className="bg-white border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Tenants</span>
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 mt-2 font-mono">
                {formatNumber(stats?.totalTenants || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Total Users</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 mt-2 font-mono">
                {formatNumber(stats?.totalUsers || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Campaigns</span>
                <Send className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 mt-2 font-mono">
                {formatNumber(stats?.totalCampaigns || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">SMS Sent</span>
                <Send className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 mt-2 font-mono">
                {formatNumber(stats?.totalSmsSent || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Human Clicks</span>
                <MousePointerClick className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 mt-2 font-mono">
                {formatNumber(stats?.totalClicks || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">ZendSMS Balance</span>
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-amber-400 mt-2 font-mono">
                ৳{formatNumber(stats?.gatewayBalance || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tenant & User Management Table */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Platform Users & Tenants ({total})</CardTitle>
              <CardDescription>View, manage credits, suspend, or promote user accounts</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  loadData(e.target.value);
                }}
                placeholder="Search user, email, phone..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="pb-3 px-3">User</th>
                    <th className="pb-3 px-3">Phone & Verified</th>
                    <th className="pb-3 px-3">Workspace</th>
                    <th className="pb-3 px-3">SMS Credits</th>
                    <th className="pb-3 px-3">Campaigns / Sent</th>
                    <th className="pb-3 px-3">Platform Role</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{u.name}</div>
                        <div className="text-slate-500 text-[11px] font-mono">{u.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono text-slate-700">{u.phone}</div>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            u.isPhoneVerified
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {u.isPhoneVerified ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{u.isPhoneVerified ? "Verified" : "Unverified"}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{u.organization?.name || "N/A"}</div>
                        <div className="text-[10px] text-slate-400 font-mono">/{u.organization?.slug || ""}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {formatNumber(u.organization?.smsCredits ?? 0)}
                          </span>
                          <button
                            onClick={() => setSelectedOrg(u.organization)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Add SMS Credits"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {u.stats?.campaignCount || 0} camps / {formatNumber(u.stats?.smsSent || 0)} sent
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.platformRole === "superadmin"
                              ? "bg-amber-50 text-amber-800 border border-amber-300 shadow-xs"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {u.platformRole === "superadmin" && <Crown className="w-3 h-3 text-amber-600" />}
                          <span>{u.platformRole === "superadmin" ? "SUPERADMIN" : "USER"}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            u.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(u._id, u.status)}
                            className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
                              u.status === "active"
                                ? "border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                            title={u.status === "active" ? "Suspend User" : "Activate User"}
                          >
                            {u.status === "active" ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => handleToggleSuperAdmin(u._id, u.platformRole)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all"
                            title={u.platformRole === "superadmin" ? "Revoke SuperAdmin" : "Grant SuperAdmin"}
                          >
                            <Crown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Credit Top-up Modal */}
        {selectedOrg && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add SMS Credits</h3>
                  <p className="text-xs text-slate-500">{selectedOrg.name}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Credit Amount to Add
                </label>
                <input
                  type="number"
                  min={1}
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2 mt-2">
                  {[50, 100, 500, 1000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCreditAmount(amt)}
                      className="px-2 py-1 text-[11px] font-mono border rounded hover:bg-slate-50 text-slate-600"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setSelectedOrg(null)} disabled={isUpdatingCredit}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleAddCredits} isLoading={isUpdatingCredit}>
                  Add Credits
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
