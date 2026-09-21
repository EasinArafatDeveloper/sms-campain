"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, Notice, PageHeader, Panel, btnPrimary, btnSecondary, tbl } from "@/components/ui/page";
import { TextField } from "@/components/auth/fields";
import { Coins, Globe, Loader2, RefreshCw, Send, Server, Sparkles, Users } from "lucide-react";
import { formatNumber, cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

type Tab = "gateway" | "general" | "team";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "gateway", label: "SMS sending", icon: Server },
  { id: "general", label: "Workspace", icon: Globe },
  { id: "team", label: "Team", icon: Users },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("gateway");

  const [orgName, setOrgName] = useState("My Workspace");
  const [defaultSenderId, setDefaultSenderId] = useState("8809612781020");
  const [trackingDomain, setTrackingDomain] = useState("https://sms-campain.vercel.app");
  const [trackingLength, setTrackingLength] = useState(6);
  const [smsCredits, setSmsCredits] = useState<number>(0);

  // ZendSMS gateway
  const [apiKey, setApiKey] = useState("");
  const [senderId, setSenderId] = useState("8809612781020");
  const [apiUrl, setApiUrl] = useState("https://api.zendsms.com/api/v1/send-sms");
  const [balance, setBalance] = useState<number | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  // Test SMS
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState(`Test SMS from ${BRAND.name}.`);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const [teamMembers, setTeamMembers] = useState<any[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.organization) {
          setOrgName(data.organization.name || "My Workspace");
          setDefaultSenderId(data.organization.defaultSenderId || "8809612781020");
          setTrackingDomain(data.organization.trackingDomain || "https://sms-campain.vercel.app");
          if (data.organization.settings?.defaultTrackingLength) setTrackingLength(data.organization.settings.defaultTrackingLength);
        }
        if (typeof data.smsCredits !== "undefined") setSmsCredits(data.smsCredits);
        if (data.providerConfig) {
          setApiKey(data.providerConfig.apiKey || "");
          setSenderId(data.providerConfig.senderId || "8809612781020");
          setApiUrl(data.providerConfig.apiUrl || "https://api.zendsms.com/api/v1/send-sms");
        }
        if (typeof data.balance !== "undefined") setBalance(data.balance);
        setTeamMembers(Array.isArray(data.teamMembers) ? data.teamMembers : []);
      } catch (err) {
        console.error(err);
        setTeamMembers([]);
      }
    }
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization: {
            name: orgName,
            defaultSenderId,
            trackingDomain,
            settings: { defaultTrackingLength: trackingLength, defaultTrackingFormat: "numeric", retentionDays: 90, enableWebhooks: true },
          },
          providerConfig: { provider: "zendsms", name: "ZendSMS Primary", apiKey, senderId, apiUrl },
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestSms = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/test-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone, message: testMessage, senderId }),
      });
      setTestResult(await res.json());
    } catch (err: any) {
      setTestResult({ error: err.message || "Failed to send the test SMS" });
    } finally {
      setIsSendingTest(false);
    }
  };

  const refreshBalance = async () => {
    setIsCheckingBalance(true);
    try {
      const json = await (await fetch("/api/settings")).json();
      if (typeof json.balance !== "undefined") setBalance(json.balance);
      if (typeof json.smsCredits !== "undefined") setSmsCredits(json.smsCredits);
    } finally {
      setIsCheckingBalance(false);
    }
  };

  const SaveButton = ({ label }: { label: string }) => (
    <button type="submit" disabled={isSaving} className={btnPrimary}>
      {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {label}
    </button>
  );

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Settings" subtitle="How your messages are sent, your workspace and your team." />

        {saveSuccess && <Notice type="success">Settings saved.</Notice>}

        {/* tabs */}
        <div role="tablist" aria-label="Settings sections" className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-slate-900">
          {TABS.map((t) => {
            const active = activeTab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                  active ? "text-white" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                {active && <motion.span layoutId="settings-tab" className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md shadow-indigo-600/25" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ---------------- SMS sending ---------------- */}
        {activeTab === "gateway" && (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 p-6 text-white shadow-lg shadow-indigo-600/20">
              <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-indigo-100">
                    <Coins className="h-4 w-4" aria-hidden="true" />
                    {balance !== null ? "ZendSMS balance" : "SMS credits"}
                  </p>
                  <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">
                    {balance !== null ? `৳${formatNumber(balance)}` : formatNumber(smsCredits)}
                  </p>
                  <p className="mt-1 text-xs text-indigo-100">
                    {balance !== null ? "Connected with your own ZendSMS account." : `Sent through the ${BRAND.name} gateway. 1 credit = 1 SMS.`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {smsCredits === 0 && balance === null && (
                    <Link href="/profile" className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-indigo-700 shadow-md transition-transform hover:-translate-y-0.5 active:scale-[0.97]">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      Get 50 free credits
                    </Link>
                  )}
                  <button type="button" onClick={refreshBalance} disabled={isCheckingBalance} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20 disabled:opacity-60">
                    <RefreshCw className={cn("h-4 w-4", isCheckingBalance && "animate-spin")} aria-hidden="true" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveSettings}>
              <Panel title="Sender" description="The name or number your recipients see">
                <div className="space-y-5">
                  <TextField label="Approved sender ID" value={senderId} onChange={(e) => setSenderId(e.target.value)} placeholder="8809612781020" className="font-mono" />

                  <details className="group rounded-xl border border-slate-200 dark:border-white/10">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Use my own ZendSMS account
                      <span className="text-xs font-medium text-slate-400 group-open:hidden">Optional</span>
                      <span className="hidden text-xs font-medium text-slate-400 group-open:inline">Hide</span>
                    </summary>
                    <div className="space-y-4 border-t border-slate-200 p-4 dark:border-white/10">
                      <TextField label="ZendSMS API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Leave empty to use the shared gateway" className="font-mono" hint={`Empty means ${BRAND.name} sends for you and uses your credits.`} />
                      <TextField label="API endpoint" type="url" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="font-mono" />
                    </div>
                  </details>

                  <div className="flex justify-end">
                    <SaveButton label="Save" />
                  </div>
                </div>
              </Panel>
            </form>

            <Panel title="Send a test SMS" description="Check that sending works before your first campaign">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Phone number" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="88017XXXXXXXX" className="font-mono" inputMode="tel" />
                <TextField label="Message" value={testMessage} onChange={(e) => setTestMessage(e.target.value)} />
              </div>

              {testResult && (
                <div className="mt-4">
                  <Notice type={testResult.success ? "success" : "error"}>
                    {testResult.success ? "Test message sent." : testResult.error || testResult.message || "The message could not be sent."}
                  </Notice>
                  <details className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <summary className="cursor-pointer">Technical details</summary>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-mono text-[11px] dark:bg-white/5">{JSON.stringify(testResult, null, 2)}</pre>
                  </details>
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button type="button" onClick={handleSendTestSms} disabled={isSendingTest || !testPhone} className={btnSecondary}>
                  {isSendingTest ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                  Send test
                </button>
              </div>
            </Panel>
          </div>
        )}

        {/* ---------------- Workspace ---------------- */}
        {activeTab === "general" && (
          <form onSubmit={handleSaveSettings}>
            <Panel title="Workspace" description="Your brand name and how links look">
              <div className="space-y-5">
                <TextField label="Workspace name" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField label="Default sender ID" value={defaultSenderId} onChange={(e) => setDefaultSenderId(e.target.value)} className="font-mono" />
                  <TextField label="Link domain" value={trackingDomain} onChange={(e) => setTrackingDomain(e.target.value)} className="font-mono" hint="Short links start with this address." />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="link-length" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Short link length
                    </label>
                    <output htmlFor="link-length" className="rounded-lg bg-indigo-50 px-2.5 py-1 font-mono text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                      {trackingLength} characters
                    </output>
                  </div>
                  <input
                    id="link-length"
                    type="range"
                    min={3}
                    max={8}
                    value={trackingLength}
                    onChange={(e) => setTrackingLength(parseInt(e.target.value, 10))}
                    style={{ "--p": `${((trackingLength - 3) / 5) * 100}%` } as React.CSSProperties}
                    className="range-fancy w-full cursor-pointer"
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Shorter links leave more room in your SMS.</p>
                </div>
                <div className="flex justify-end">
                  <SaveButton label="Save" />
                </div>
              </div>
            </Panel>
          </form>
        )}

        {/* ---------------- Team ---------------- */}
        {activeTab === "team" && (
          <Panel flush title="Team" description="People who can use this workspace">
            {teamMembers === null ? (
              <p className="px-6 py-10 text-center text-sm text-slate-400">Loading…</p>
            ) : teamMembers.length === 0 ? (
              <EmptyState icon={Users} title="Only you so far" />
            ) : (
              <div className={tbl.wrap}>
                <table className={tbl.table}>
                  <thead className={tbl.head}>
                    <tr>
                      <th className={tbl.th}>Name</th>
                      <th className={`${tbl.th} hidden sm:table-cell`}>Email</th>
                      <th className={tbl.th}>Role</th>
                      <th className={`${tbl.th} text-right`}>Status</th>
                    </tr>
                  </thead>
                  <tbody className={tbl.body}>
                    {teamMembers.map((m, idx) => (
                      <tr key={idx} className={tbl.row}>
                        <td className={tbl.td}>
                          <span className="font-semibold text-slate-900 dark:text-white">{m.name}</span>
                          <span className="block text-xs text-slate-400 sm:hidden">{m.email}</span>
                        </td>
                        <td className={`${tbl.td} hidden text-slate-500 sm:table-cell`}>{m.email}</td>
                        <td className={tbl.td}>
                          <Badge variant="default" className="capitalize">
                            {m.role || "Owner"}
                          </Badge>
                        </td>
                        <td className={`${tbl.td} text-right`}>
                          <Badge variant="success" className="capitalize">
                            {m.status || "active"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )}
      </div>
    </AppLayout>
  );
}
