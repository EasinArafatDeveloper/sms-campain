"use client";

import React from "react";
import { AdminUser } from "@/types/admin";
import {
  Users,
  Search,
  Download,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Building2,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  X,
  Phone,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface AdminUsersTableProps {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  searchQuery: string;
  verifiedFilter: string;
  statusFilter: string;
  roleFilter: string;
  selectedIds: string[];
  currentAdminId: string;
  onSearchChange: (q: string) => void;
  onVerifiedFilterChange: (v: string) => void;
  onStatusFilterChange: (s: string) => void;
  onRoleFilterChange: (r: string) => void;
  onPageChange: (p: number) => void;
  onToggleSelectId: (id: string) => void;
  onSelectAllIds: () => void;
  onUpdateUser: (userId: string, data: { status?: string; platformRole?: string }) => Promise<void>;
  onBulkAction: (action: "activate" | "suspend") => void;
  onExportCsv: () => void;
}

export function AdminUsersTable({
  users,
  total,
  page,
  limit,
  totalPages,
  loading,
  searchQuery,
  verifiedFilter,
  statusFilter,
  roleFilter,
  selectedIds,
  currentAdminId,
  onSearchChange,
  onVerifiedFilterChange,
  onStatusFilterChange,
  onRoleFilterChange,
  onPageChange,
  onToggleSelectId,
  onSelectAllIds,
  onUpdateUser,
  onBulkAction,
  onExportCsv,
}: AdminUsersTableProps) {
  const allSelected = users.length > 0 && selectedIds.length === users.length;

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
            placeholder="Search user name, email, or phone number..."
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
          {/* Verified Filter */}
          <select
            value={verifiedFilter}
            onChange={(e) => onVerifiedFilterChange(e.target.value)}
            className="px-2.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
          >
            <option value="all">All Verification</option>
            <option value="verified">Phone Verified Only</option>
            <option value="unverified">Unverified Only</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-2.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            className="px-2.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="superadmin">SuperAdmin</option>
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

      {/* 2. Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
            <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{selectedIds.length} user{selectedIds.length > 1 ? "s" : ""} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBulkAction("suspend")}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors"
            >
              Disable Selected
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
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Mobile & Verification</th>
                <th className="py-3 px-4">Workspace</th>
                <th className="py-3 px-4">Workspace Role</th>
                <th className="py-3 px-4">Platform Privilege</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300 font-medium">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><Skeleton className="h-4 w-4 rounded-sm" /></td>
                    <td className="py-4 px-4 space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-40" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-14 rounded-full" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-4 px-4 text-right"><Skeleton className="h-8 w-20 ml-auto rounded-lg" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">No users found</div>
                    <p className="text-xs mt-1">Try adjusting your search criteria.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelected = selectedIds.includes(u._id);
                  const isSelf = u._id === currentAdminId;

                  return (
                    <tr
                      key={u._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onToggleSelectId(u._id)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isSelf && (
                            <span className="px-1.5 py-0.2 rounded-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-3xs font-black">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-2xs text-slate-500 dark:text-slate-400 font-mono">
                          {u.email}
                        </div>
                      </td>

                      {/* Phone & Verification */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-2xs text-slate-700 dark:text-slate-300">
                            {u.phone || "N/A"}
                          </span>
                          {u.isPhoneVerified ? (
                            <span className="flex items-center gap-0.5 text-3xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded-full">
                              <ShieldCheck className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="text-3xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-full">
                              Unverified
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Default Workspace */}
                      <td className="py-3.5 px-4">
                        {u.organization ? (
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">
                              {u.organization.name}
                            </div>
                            <div className="text-2xs text-slate-400 font-mono">
                              /{u.organization.slug}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-2xs">None</span>
                        )}
                      </td>

                      {/* Workspace Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 text-2xs font-bold rounded-full uppercase tracking-wider ${
                            u.role === "owner"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Platform Privilege */}
                      <td className="py-3.5 px-4">
                        <button
                          disabled={isSelf}
                          onClick={() =>
                            onUpdateUser(u._id, {
                              platformRole: u.platformRole === "superadmin" ? "user" : "superadmin",
                            })
                          }
                          title={isSelf ? "Cannot revoke self" : "Toggle SuperAdmin access"}
                          className={`px-2 py-0.5 text-2xs font-bold rounded-full flex items-center gap-1 transition-all ${
                            u.platformRole === "superadmin"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 ring-1 ring-amber-400/40"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
                          } ${isSelf ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{u.platformRole === "superadmin" ? "SuperAdmin" : "Standard"}</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          disabled={isSelf}
                          onClick={() =>
                            onUpdateUser(u._id, {
                              status: u.status === "active" ? "disabled" : "active",
                            })
                          }
                          title={isSelf ? "Cannot disable self" : "Toggle active/disabled status"}
                          className={`px-2 py-0.5 text-2xs font-semibold rounded-full transition-all ${
                            u.status === "active"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          } ${isSelf ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                        >
                          {u.status}
                        </button>
                      </td>

                      {/* Joined */}
                      <td className="py-3.5 px-4 text-2xs text-slate-500 dark:text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            disabled={isSelf}
                            onClick={() =>
                              onUpdateUser(u._id, {
                                status: u.status === "active" ? "disabled" : "active",
                              })
                            }
                            className={`px-2 py-1 text-2xs font-bold rounded-md transition-colors ${
                              u.status === "active"
                                ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            } disabled:opacity-30 disabled:cursor-not-allowed`}
                          >
                            {u.status === "active" ? "Disable" : "Enable"}
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
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} users
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
