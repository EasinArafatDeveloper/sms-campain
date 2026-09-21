"use client";

import React, { useState } from "react";
import { AdminTenant } from "@/types/admin";
import {
  Building2,
  Search,
  Download,
  Filter,
  Coins,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckSquare,
  Square,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Users,
  Send,
  Eye,
  X,
  ArrowUpDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface AdminTenantsTableProps {
  tenants: AdminTenant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  searchQuery: string;
  planFilter: string;
  statusFilter: string;
  creditAlertFilter: string;
  selectedIds: string[];
  onSearchChange: (q: string) => void;
  onPlanFilterChange: (p: string) => void;
  onStatusFilterChange: (s: string) => void;
  onCreditAlertFilterChange: (c: string) => void;
  onPageChange: (p: number) => void;
  onSelectTenant: (tenantId: string) => void;
  onToggleSelectId: (id: string) => void;
  onSelectAllIds: () => void;
  onOpenCreditModal: (tenant: { _id: string; name: string; smsCredits: number }) => void;
  onOpenConfirmModal: (action: () => Promise<void>, title: string, message: string, isDestructive?: boolean) => void;
  onBulkAction: (action: "activate" | "suspend" | "add_credits" | "change_plan", amount?: number, plan?: any) => void;
  onExportCsv: () => void;
}

export function AdminTenantsTable({
  tenants,
  total,
  page,
  limit,
  totalPages,
  loading,
  searchQuery,
  planFilter,
  statusFilter,
  creditAlertFilter,
  selectedIds,
  onSearchChange,
  onPlanFilterChange,
  onStatusFilterChange,
  onCreditAlertFilterChange,
  onPageChange,
  onSelectTenant,
  onToggleSelectId,
  onSelectAllIds,
  onOpenCreditModal,
  onOpenConfirmModal,
  onBulkAction,
  onExportCsv,
}: AdminTenantsTableProps) {
  const allSelected = tenants.length > 0 && selectedIds.length === tenants.length;

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. Filter, Search & Export Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search workspace, slug, or owner (Press / to search)..."
            className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => onPlanFilterChange(e.target.value)}
            className="px-2.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
          >
            <option value="all">All Plans</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="enterprise">Enterprise</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-2.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          {/* Credit Alert Filter */}
          <select
            value={creditAlertFilter}
            onChange={(e) => onCreditAlertFilterChange(e.target.value)}
            className="px-2.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
          >
            <option value="all">All Balances</option>
            <option value="zero">Zero Credits (Blocked)</option>
            <option value="low">Low Credits (≤ 10)</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Bulk Action Toolbar (appears when items selected) */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
            <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{selectedIds.length} workspace{selectedIds.length > 1 ? "s" : ""} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBulkAction("add_credits", 100)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              +100 Credits All
            </button>
            <button
              onClick={() => onBulkAction("suspend")}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors"
            >
              Suspend Selected
            </button>
            <button
              onClick={() => onBulkAction("activate")}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              Activate Selected
            </button>
          </div>
        </div>
      )}

      {/* 3. Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 w-10">
                  <button onClick={onSelectAllIds} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    {allSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="py-3 px-4">Workspace / Slug</th>
                <th className="py-3 px-4">Owner Contact</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">SMS Balance</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4">Campaigns / Sent</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300 font-medium">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><Skeleton className="h-4 w-4 rounded-sm" /></td>
                    <td className="py-4 px-4 space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></td>
                    <td className="py-4 px-4 space-y-1"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-36" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-10" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-14 rounded-full" /></td>
                    <td className="py-4 px-4 text-right"><Skeleton className="h-8 w-16 ml-auto rounded-lg" /></td>
                  </tr>
                ))
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">No workspaces found</div>
                    <p className="text-xs mt-1">Try adjusting your filters or search query.</p>
                  </td>
                </tr>
              ) : (
                tenants.map((t) => {
                  const isSelected = selectedIds.includes(t._id);
                  const isZeroCredit = t.smsCredits <= 0;
                  const isLowCredit = t.smsCredits > 0 && t.smsCredits <= 10;

                  return (
                    <tr
                      key={t._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectTenant(t._id)}
                    >
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onToggleSelectId(t._id)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Name & Slug */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1.5">
                          <span>{t.name}</span>
                        </div>
                        <div className="text-2xs text-slate-500 dark:text-slate-400 font-mono">
                          /{t.slug}
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="py-3.5 px-4">
                        {t.owner ? (
                          <div>
                            <div className="text-slate-900 dark:text-white font-semibold flex items-center gap-1">
                              <span>{t.owner.name}</span>
                              {t.owner.isPhoneVerified && (
                                <span title="Phone Verified">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                </span>
                              )}
                            </div>
                            <div className="text-2xs text-slate-500 dark:text-slate-400">
                              {t.owner.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-2xs italic">No owner assigned</span>
                        )}
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 text-2xs font-bold rounded-full uppercase tracking-wider ${
                            t.plan === "enterprise"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                              : t.plan === "growth"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {t.plan}
                        </span>
                      </td>

                      {/* Credits */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono font-bold ${
                              isZeroCredit
                                ? "text-red-600 dark:text-red-400"
                                : isLowCredit
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-slate-900 dark:text-white"
                            }`}
                          >
                            {t.smsCredits.toLocaleString()}
                          </span>
                          {isZeroCredit ? (
                            <span className="px-1.5 py-0.2 rounded-xs bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 text-3xs font-black">
                              ZERO
                            </span>
                          ) : isLowCredit ? (
                            <span className="px-1.5 py-0.2 rounded-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-3xs font-black">
                              LOW
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Team Member Count */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Users className="w-3.5 h-3.5" />
                          <span>{t.memberCount}</span>
                        </div>
                      </td>

                      {/* Campaigns & SMS */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 dark:text-white font-semibold">
                          {t.campaignCount} campaigns
                        </div>
                        <div className="text-2xs text-slate-500 dark:text-slate-400">
                          {t.smsSent.toLocaleString()} SMS sent
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 text-2xs font-semibold rounded-full ${
                            t.status === "active"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenCreditModal({ _id: t._id, name: t.name, smsCredits: t.smsCredits })}
                            title="Adjust SMS Credits"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                          >
                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                          </button>
                          <button
                            onClick={() => onSelectTenant(t._id)}
                            title="View Workspace Details Drawer"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
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

        {/* 4. Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs">
            <div className="text-slate-500 dark:text-slate-400 font-medium">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} workspaces
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 py-1 font-bold text-slate-900 dark:text-white">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
