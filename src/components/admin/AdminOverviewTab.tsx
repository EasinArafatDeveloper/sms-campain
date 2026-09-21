"use client";

import React from "react";
import {
  AdminStats,
  AdminTab,
} from "@/types/admin";
import {
  Building2,
  Users,
  Send,
  MousePointerClick,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  PhoneCall,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface AdminOverviewTabProps {
  stats: AdminStats | null;
  onNavigateTab: (tab: AdminTab, filter?: { key: string; value: string }) => void;
  onOpenCreditModal: (tenant: { _id: string; name: string; smsCredits: number }) => void;
  onRefresh: () => void;
}

export function AdminOverviewTab({
  stats,
  onNavigateTab,
  onOpenCreditModal,
}: AdminOverviewTabProps) {
  if (!stats) return null;

  const timeseriesData = stats.timeseries || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Platform Infrastructure & Health Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xs">
        {/* Gateway Balance & Health */}
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50/80 dark:bg-slate-800/50">
          <div className={`p-2 rounded-lg ${stats.gatewayHealthy ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gateway Pool</span>
              <span className={`inline-block w-2 h-2 rounded-full ${stats.gatewayHealthy ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {stats.gatewayBalance !== null ? `৳${stats.gatewayBalance.toLocaleString()}` : "Offline / Unchecked"}
            </div>
          </div>
        </div>

        {/* SMS Delivery Success Rate */}
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50/80 dark:bg-slate-800/50">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Delivery Success Rate</span>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {stats.deliverySuccessRate}% <span className="text-xs font-normal text-slate-400">({stats.totalSmsDelivered.toLocaleString()} delivered)</span>
            </div>
          </div>
        </div>

        {/* Queue Backlog */}
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50/80 dark:bg-slate-800/50">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Queue Processing Backlog</span>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {stats.queueBacklog} jobs <span className="text-xs font-normal text-slate-400">queued</span>
            </div>
          </div>
        </div>

        {/* Rate Limiter Mode */}
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50/80 dark:bg-slate-800/50">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rate Limiter</span>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{stats.rateLimiterMode === "upstash_redis" ? "Upstash Redis (Distributed)" : "In-Memory Sliding"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Workspaces */}
        <div
          onClick={() => onNavigateTab("tenants")}
          className="group cursor-pointer p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500/50 hover:shadow-md transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Workspaces</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {stats.totalTenants.toLocaleString()}
          </div>
          <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
            <span>Manage Tenants</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
          </div>
        </div>

        {/* Users */}
        <div
          onClick={() => onNavigateTab("users")}
          className="group cursor-pointer p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/50 hover:shadow-md transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Users</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {stats.totalUsers.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            +{stats.recentSignups} this week
          </div>
        </div>

        {/* Campaigns */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Campaigns</span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {stats.totalCampaigns.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total marketing runs
          </div>
        </div>

        {/* SMS Dispatched */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">SMS Sent</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {stats.totalSmsSent.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {stats.totalSmsFailed > 0 ? `${stats.totalSmsFailed} failed` : "All delivered/sent"}
          </div>
        </div>

        {/* Verified Human Clicks */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Human Clicks</span>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {stats.totalClicks.toLocaleString()}
          </div>
          <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
            Anti-bot verified
          </div>
        </div>

        {/* Security & Access */}
        <div
          onClick={() => onNavigateTab("audit")}
          className="group cursor-pointer p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500/50 hover:shadow-md transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Audit Trail</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Active
          </div>
          <div className="flex items-center text-xs text-amber-600 dark:text-amber-400 font-medium group-hover:underline">
            <span>View Logs</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
          </div>
        </div>
      </div>

      {/* 3. Recharts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SMS Volume Trend */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">SMS Dispatch & Delivery Trend</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Daily message dispatch volume over the last 14 days</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
              14 Days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeseriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSms" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => v.slice(5)}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="smsSent" name="SMS Sent" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSms)" />
                <Area type="monotone" dataKey="delivered" name="Delivered" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorDelivered)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth & Signups Trend */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Workspace & User Signups</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Daily platform user registrations and new organizations</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300">
              Growth
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeseriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => v.slice(5)}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
                <Line type="monotone" dataKey="signups" name="User Signups" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="newWorkspaces" name="New Workspaces" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Actionable Alert & Triage Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Low / Zero Credit Workspaces */}
        <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Credit Depletion Triage</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Workspaces with zero or dangerously low SMS credits</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("tenants", { key: "creditAlert", value: "zero" })}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              View All ({stats.alerts.zeroCreditsCount + stats.alerts.lowCreditsCount})
            </button>
          </div>

          <div className="space-y-2">
            {stats.alerts.zeroCreditTenants.length === 0 && stats.alerts.lowCreditTenants.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                ✓ All active workspaces have sufficient SMS credits.
              </div>
            ) : (
              <>
                {stats.alerts.zeroCreditTenants.map((t) => (
                  <div
                    key={t._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</div>
                      <div className="text-2xs text-red-600 dark:text-red-400 font-semibold">0 Credits Remaining (Blocked)</div>
                    </div>
                    <button
                      onClick={() => onOpenCreditModal({ _id: t._id, name: t.name, smsCredits: 0 })}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors"
                    >
                      Top-up
                    </button>
                  </div>
                ))}
                {stats.alerts.lowCreditTenants.map((t) => (
                  <div
                    key={t._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 shadow-2xs"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</div>
                      <div className="text-2xs text-amber-600 dark:text-amber-400 font-semibold">{t.smsCredits} Credits Remaining</div>
                    </div>
                    <button
                      onClick={() => onOpenCreditModal({ _id: t._id, name: t.name, smsCredits: t.smsCredits })}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors"
                    >
                      Top-up
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Unverified Users Panel */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Unverified Phone Accounts</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Users who haven't completed SMS OTP verification</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("users", { key: "verified", value: "false" })}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All ({stats.alerts.unverifiedUsersCount})
            </button>
          </div>

          <div className="space-y-2">
            {stats.alerts.unverifiedUsers.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                ✓ All users have completed mobile verification.
              </div>
            ) : (
              stats.alerts.unverifiedUsers.slice(0, 4).map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-2xs"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{u.name}</div>
                    <div className="text-2xs text-slate-500 dark:text-slate-400">{u.email} • {u.phone}</div>
                  </div>
                  <span className="px-2 py-0.5 text-2xs font-semibold rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Unverified
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
