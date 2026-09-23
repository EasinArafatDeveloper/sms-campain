"use client";

import React, { useEffect, useState } from "react";
import { AdminAuditLog } from "@/types/admin";
import {
  ShieldCheck,
  Search,
  Download,
  Filter,
  Eye,
  X,
  Clock,
  User,
  Building2,
  FileText,
  MessageSquareText,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface CampaignRecipientRow {
  _id: string;
  phone: string;
  recipientName?: string;
  personalizedMessage: string;
  deliveryStatus: string;
  clickCount: number;
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
}

interface CampaignRecipientsResponse {
  campaign: {
    name: string;
    status: string;
    senderId: string;
    totalRecipients: number;
    sentCount: number;
    organization?: { name: string };
  };
  recipients: CampaignRecipientRow[];
  total: number;
  page: number;
  totalPages: number;
}

interface AdminAuditTabProps {
  logs: AdminAuditLog[];
  loading: boolean;
  onExportCsv: () => void;
}

export function AdminAuditTab({
  logs,
  loading,
  onExportCsv,
}: AdminAuditTabProps) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

  // SMS recipients drill-down for campaign-related log entries
  const [recipientsData, setRecipientsData] = useState<CampaignRecipientsResponse | null>(null);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [recipientsError, setRecipientsError] = useState<string | null>(null);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientPage, setRecipientPage] = useState(1);

  const isCampaignLog = selectedLog?.resourceType?.toLowerCase() === "campaign" && !!selectedLog?.resourceId;

  useEffect(() => {
    if (!isCampaignLog || !selectedLog) {
      setRecipientsData(null);
      setRecipientsError(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoadingRecipients(true);
      setRecipientsError(null);
      try {
        const params = new URLSearchParams({ page: String(recipientPage), limit: "20" });
        if (recipientSearch.trim()) params.set("search", recipientSearch.trim());
        const res = await fetch(`/api/admin/campaigns/${selectedLog.resourceId}/recipients?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load SMS recipients");
        if (!cancelled) setRecipientsData(data);
      } catch (err: any) {
        if (!cancelled) setRecipientsError(err.message || "Failed to load SMS recipients");
      } finally {
        if (!cancelled) setIsLoadingRecipients(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isCampaignLog, selectedLog, recipientPage, recipientSearch]);

  function closeLogModal() {
    setSelectedLog(null);
    setRecipientsData(null);
    setRecipientsError(null);
    setRecipientSearch("");
    setRecipientPage(1);
  }

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== "all" && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.userEmail.toLowerCase().includes(q) ||
        log.organizationName.toLowerCase().includes(q) ||
        JSON.stringify(log.metadata).toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit actions, admin email, workspace, or metadata..."
            className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
          >
            <option value="all">All Audit Actions</option>
            <option value="CAMPAIGN">Campaigns (Created / Sent / Deleted)</option>
            <option value="CREDITS">Credits Adjustments</option>
            <option value="USER">User Updates</option>
            <option value="ORGANIZATION">Organization / Workspace</option>
            <option value="BULK">Bulk Operations</option>
          </select>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Audit Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Admin Performer</th>
                <th className="py-3 px-4">Target Workspace</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Metadata Summary</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300 font-medium">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><Skeleton className="h-5 w-28 rounded-full" /></td>
                    <td className="py-4 px-4 space-y-1"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-36" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-4 text-right"><Skeleton className="h-6 w-12 ml-auto rounded-md" /></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">No audit logs found</div>
                    <p className="text-xs mt-1">Try adjusting your search criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    {/* Action */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 text-2xs font-bold rounded-full uppercase tracking-wider ${
                          log.action.includes("CREDITS")
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                            : log.action.includes("SUSPEND") || log.action.includes("DISABLE")
                            ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                            : log.action.includes("ACTIVATE")
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Performer */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{log.userName}</div>
                      <div className="text-2xs text-slate-500 dark:text-slate-400 font-mono">{log.userEmail}</div>
                    </td>

                    {/* Target Workspace */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">
                        {log.organizationName}
                      </span>
                    </td>

                    {/* Resource */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {log.resourceType}
                    </td>

                    {/* Metadata Summary */}
                    <td className="py-3 px-4">
                      <div className="text-2xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] font-mono">
                        {log.metadata?.reason || log.metadata?.action || JSON.stringify(log.metadata)}
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 text-2xs text-slate-500 dark:text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Metadata / SMS Recipients Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full ${isCampaignLog ? "max-w-3xl" : "max-w-lg"} rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto`}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Audit Log Inspection</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedLog.action}</p>
              </div>
              <button
                onClick={closeLogModal}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Admin User:</span>
                  <div className="font-bold text-slate-900 dark:text-white">{selectedLog.userName} ({selectedLog.userEmail})</div>
                </div>
                <div>
                  <span className="text-slate-500">Timestamp:</span>
                  <div className="font-bold text-slate-900 dark:text-white">{new Date(selectedLog.createdAt).toLocaleString()}</div>
                </div>
              </div>

              {/* SMS Recipients drill-down: only for campaign-related audit entries */}
              {isCampaignLog && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                      <MessageSquareText className="w-3.5 h-3.5" />
                      <span>SMS Recipients</span>
                      {recipientsData && (
                        <span className="font-normal text-slate-400">
                          — {recipientsData.campaign.sentCount} of {recipientsData.campaign.totalRecipients} sent
                        </span>
                      )}
                    </div>
                    <div className="relative w-40">
                      <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={recipientSearch}
                        onChange={(e) => {
                          setRecipientSearch(e.target.value);
                          setRecipientPage(1);
                        }}
                        placeholder="Search phone..."
                        className="w-full pl-6 pr-2 py-1 text-2xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {isLoadingRecipients ? (
                    <div className="py-8 flex items-center justify-center text-slate-400 gap-2 text-2xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading recipients...</span>
                    </div>
                  ) : recipientsError ? (
                    <div className="py-6 text-center text-2xs text-red-500">{recipientsError}</div>
                  ) : !recipientsData || recipientsData.recipients.length === 0 ? (
                    <div className="py-6 text-center text-2xs text-slate-400">
                      No recipients found{recipientSearch ? " for this search" : " — this campaign has not been sent yet"}.
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto max-h-64">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sticky top-0">
                              <th className="py-2 px-3">Phone</th>
                              <th className="py-2 px-3">Message Sent</th>
                              <th className="py-2 px-3">Status</th>
                              <th className="py-2 px-3">Sent At</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-2xs">
                            {recipientsData.recipients.map((r) => (
                              <tr key={r._id}>
                                <td className="py-2 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                  {r.phone}
                                </td>
                                <td className="py-2 px-3 text-slate-500 dark:text-slate-400 max-w-[260px] truncate" title={r.personalizedMessage}>
                                  {r.personalizedMessage}
                                </td>
                                <td className="py-2 px-3">
                                  <span
                                    className={`px-1.5 py-0.5 rounded-full text-2xs font-bold uppercase ${
                                      r.deliveryStatus === "delivered" || r.deliveryStatus === "sent"
                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                                        : r.deliveryStatus === "failed"
                                        ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                    }`}
                                    title={r.errorMessage || undefined}
                                  >
                                    {r.deliveryStatus}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                  {r.sentAt ? new Date(r.sentAt).toLocaleString() : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {recipientsData.totalPages > 1 && (
                        <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-2xs text-slate-500">
                          <span>Page {recipientsData.page} of {recipientsData.totalPages} ({recipientsData.total} total)</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setRecipientPage((p) => Math.max(1, p - 1))}
                              disabled={recipientsData.page <= 1}
                              className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setRecipientPage((p) => Math.min(recipientsData.totalPages, p + 1))}
                              disabled={recipientsData.page >= recipientsData.totalPages}
                              className="p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div>
                <span className="text-slate-500 font-semibold mb-1 block">Full Metadata & Payload:</span>
                <pre className="p-3 rounded-xl bg-slate-950 text-slate-200 text-2xs font-mono overflow-x-auto max-h-60">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={closeLogModal}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
