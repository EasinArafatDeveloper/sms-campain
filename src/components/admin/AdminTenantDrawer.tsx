"use client";

import React, { useState, useEffect } from "react";
import { AdminTenantDetail } from "@/types/admin";
import {
  X,
  Building2,
  Users,
  Coins,
  Send,
  History,
  ShieldCheck,
  ShieldAlert,
  Key,
  Copy,
  Check,
  Save,
  Clock,
  Sparkles,
  ExternalLink,
  Lock,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";

interface AdminTenantDrawerProps {
  tenantId: string | null;
  onClose: () => void;
  onOpenCreditModal: (tenant: { _id: string; name: string; smsCredits: number }) => void;
  onUpdateTenant: (id: string, update: { plan?: string; status?: string; defaultSenderId?: string; name?: string }) => Promise<void>;
  onRefresh: () => void;
}

export function AdminTenantDrawer({
  tenantId,
  onClose,
  onOpenCreditModal,
  onUpdateTenant,
  onRefresh,
}: AdminTenantDrawerProps) {
  const [detail, setDetail] = useState<AdminTenantDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "campaigns" | "ledger">("overview");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form states
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "growth" | "enterprise">("starter");
  const [senderId, setSenderId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tenantId) return;

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/tenants/${tenantId}`);
        const data = await res.json();
        if (data.success && data.tenant) {
          setDetail(data.tenant);
          setSelectedPlan(data.tenant.plan);
          setSenderId(data.tenant.defaultSenderId);
        } else {
          toast.error(data.error || "Failed to load workspace details");
        }
      } catch (err: any) {
        toast.error("Failed to connect to admin server");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [tenantId]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!tenantId) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Copied ${field} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveSettings = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      await onUpdateTenant(detail._id, {
        plan: selectedPlan,
        defaultSenderId: senderId,
      });
      toast.success("Workspace settings updated successfully");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!detail) return;
    const nextStatus = detail.status === "active" ? "suspended" : "active";
    setSaving(true);
    try {
      await onUpdateTenant(detail._id, { status: nextStatus });
      setDetail({ ...detail, status: nextStatus });
      toast.success(`Workspace is now ${nextStatus}`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to change status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {loading ? "Loading Workspace..." : detail?.name}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span>/{detail?.slug}</span>
                    <span>•</span>
                    <button
                      onClick={() => copyToClipboard(detail?._id || "", "Workspace ID")}
                      className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      <span>ID: {detail?._id.slice(0, 8)}...</span>
                      {copiedField === "Workspace ID" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Stats Strip */}
          {detail && (
            <div className="grid grid-cols-4 gap-2 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 text-center">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-2xs text-slate-500 dark:text-slate-400 font-semibold">SMS Balance</div>
                <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {detail.smsCredits.toLocaleString()}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-2xs text-slate-500 dark:text-slate-400 font-semibold">Campaigns</div>
                <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {detail.campaignCount}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-2xs text-slate-500 dark:text-slate-400 font-semibold">Total Sent</div>
                <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {detail.smsSent.toLocaleString()}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-2xs text-slate-500 dark:text-slate-400 font-semibold">Human Clicks</div>
                <div className="text-sm font-black text-rose-600 dark:text-rose-400 mt-0.5">
                  {detail.totalClicks.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 px-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === "overview"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              Overview & Settings
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === "members"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              Team Members ({detail?.members.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("campaigns")}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === "campaigns"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              Recent Campaigns ({detail?.recentCampaigns.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("ledger")}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === "ledger"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              Credit Ledger
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="space-y-4">
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
                <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
                <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
              </div>
            ) : detail ? (
              <>
                {/* 1. Overview & Settings Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Action Bar */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Workspace State</div>
                        <div className="text-2xs text-slate-500 dark:text-slate-400">
                          Current status: <span className="font-bold uppercase text-blue-600">{detail.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenCreditModal({ _id: detail._id, name: detail.name, smsCredits: detail.smsCredits })}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Adjust Credits</span>
                        </button>
                        <button
                          onClick={handleToggleStatus}
                          disabled={saving}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                            detail.status === "active"
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          {detail.status === "active" ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          <span>{detail.status === "active" ? "Suspend Workspace" : "Re-activate Workspace"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Plan & Configuration Card */}
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span>SaaS Subscription Plan & Sender ID</span>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Subscription Tier
                          </label>
                          <select
                            value={selectedPlan}
                            onChange={(e) => setSelectedPlan(e.target.value as any)}
                            className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                          >
                            <option value="starter">Starter (Standard features)</option>
                            <option value="growth">Growth (Higher throughput)</option>
                            <option value="enterprise">Enterprise (Unlimited + Dedicated)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Default Sender ID
                          </label>
                          <input
                            type="text"
                            value={senderId}
                            onChange={(e) => setSenderId(e.target.value)}
                            placeholder="e.g. 8809612781020"
                            className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={handleSaveSettings}
                          disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{saving ? "Saving Changes..." : "Save Workspace Settings"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Gateway & Domain Status */}
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Key className="w-4 h-4 text-blue-500" />
                        <span>Delivery Gateway & Link Attribution Domain</span>
                      </h3>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                          <div className="text-slate-500 dark:text-slate-400 font-semibold">BYOK Custom API Key</div>
                          <div className="font-bold text-slate-900 dark:text-white mt-1">
                            {detail.hasCustomApiKey ? "Configured (Custom Gateway)" : "Platform Shared Gateway"}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                          <div className="text-slate-500 dark:text-slate-400 font-semibold">Custom Tracking Domain</div>
                          <div className="font-bold text-slate-900 dark:text-white mt-1 truncate">
                            {detail.trackingDomain || "Default Platform Domain"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Team Members Tab */}
                {activeTab === "members" && (
                  <div className="space-y-3">
                    {detail.members.map((m) => (
                      <div
                        key={m._id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{m.name}</span>
                            <span
                              className={`px-2 py-0.2 text-3xs font-bold rounded-full uppercase tracking-wider ${
                                m.role === "owner"
                                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              }`}
                            >
                              {m.role}
                            </span>
                            {m.isPhoneVerified && (
                              <span className="flex items-center gap-0.5 text-3xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded-full">
                                <ShieldCheck className="w-3 h-3" /> Verified
                              </span>
                            )}
                          </div>
                          <div className="text-2xs text-slate-500 dark:text-slate-400">
                            {m.email} • {m.phone || "No phone"}
                          </div>
                        </div>

                        <div className="text-2xs text-slate-400 font-mono">
                          Joined {new Date(m.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Recent Campaigns Tab */}
                {activeTab === "campaigns" && (
                  <div className="space-y-3">
                    {detail.recentCampaigns.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">No campaigns launched yet.</div>
                    ) : (
                      detail.recentCampaigns.map((c) => (
                        <div
                          key={c._id}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-xs text-slate-900 dark:text-white">{c.name}</div>
                            <span
                              className={`px-2 py-0.5 text-3xs font-bold rounded-full uppercase ${
                                c.status === "completed"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                  : c.status === "sending"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-4 gap-2 text-2xs text-center border-t border-slate-100 dark:border-slate-800 pt-2">
                            <div>
                              <span className="text-slate-400">Recipients</span>
                              <div className="font-bold text-slate-900 dark:text-white">{c.totalRecipients}</div>
                            </div>
                            <div>
                              <span className="text-slate-400">Sent</span>
                              <div className="font-bold text-slate-900 dark:text-white">{c.sent}</div>
                            </div>
                            <div>
                              <span className="text-slate-400">Delivered</span>
                              <div className="font-bold text-emerald-600 dark:text-emerald-400">{c.delivered}</div>
                            </div>
                            <div>
                              <span className="text-slate-400">Clicks</span>
                              <div className="font-bold text-rose-600 dark:text-rose-400">{c.clicks}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 4. Credit Ledger Tab */}
                {activeTab === "ledger" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Transaction History</span>
                      <button
                        onClick={() => onOpenCreditModal({ _id: detail._id, name: detail.name, smsCredits: detail.smsCredits })}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        + Add Credits
                      </button>
                    </div>

                    {detail.creditHistory.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">No credit adjustments on record.</div>
                    ) : (
                      detail.creditHistory.map((item) => (
                        <div
                          key={item._id}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-2xs">
                              {item.action}
                            </span>
                            <span className="text-2xs text-slate-400">
                              {new Date(item.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              {item.previousCredits} → <span className="font-bold text-slate-900 dark:text-white">{item.newCredits} Credits</span>
                            </span>
                            {item.paymentRef && (
                              <span className="text-2xs font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-sm">
                                Ref: {item.paymentRef}
                              </span>
                            )}
                          </div>

                          {item.reason && (
                            <div className="text-2xs text-slate-500 italic">Memo: {item.reason}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
