"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Server,
  Users,
  Send,
  CheckCircle2,
  AlertCircle,
  Key,
  Globe,
  RotateCw,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "gateway" | "team">("gateway");

  // State
  const [orgName, setOrgName] = useState("My Workspace");
  const [defaultSenderId, setDefaultSenderId] = useState("8809612781020");
  const [trackingDomain, setTrackingDomain] = useState("https://postman.asia");
  const [trackingLength, setTrackingLength] = useState(6);
  const [smsCredits, setSmsCredits] = useState<number>(20);

  // SMS Gateway Config (ZendSMS)
  const [apiKey, setApiKey] = useState("");
  const [senderId, setSenderId] = useState("8809612781020");
  const [apiUrl, setApiUrl] = useState("https://api.zendsms.com/api/v1/send-sms");
  const [balance, setBalance] = useState<number | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  // Test SMS State
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Test SMS verification from SMSPro ZendSMS Gateway.");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const [teamMembers, setTeamMembers] = useState<any[]>([]);

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
          setTrackingDomain(data.organization.trackingDomain || "https://postman.asia");
          if (data.organization.settings?.defaultTrackingLength) {
            setTrackingLength(data.organization.settings.defaultTrackingLength);
          }
        }
        if (typeof data.smsCredits !== "undefined") {
          setSmsCredits(data.smsCredits);
        }
        if (data.providerConfig) {
          setApiKey(data.providerConfig.apiKey || "");
          setSenderId(data.providerConfig.senderId || "8809612781020");
          setApiUrl(data.providerConfig.apiUrl || "https://api.zendsms.com/api/v1/send-sms");
        }
        if (typeof data.balance !== "undefined") {
          setBalance(data.balance);
        }
        if (Array.isArray(data.teamMembers)) {
          setTeamMembers(data.teamMembers);
        }
      } catch (err) {
        console.error(err);
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
            settings: {
              defaultTrackingLength: trackingLength,
              defaultTrackingFormat: "numeric",
              retentionDays: 90,
              enableWebhooks: true,
            },
          },
          providerConfig: {
            provider: "zendsms",
            name: "ZendSMS Primary",
            apiKey,
            senderId,
            apiUrl,
          },
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
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage,
          senderId,
        }),
      });
      const json = await res.json();
      setTestResult(json);
    } catch (err: any) {
      setTestResult({ error: err.message || "Failed to dispatch test SMS" });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Organization Settings</h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure SMS Gateway credentials, custom tracking domain, and team members.
            </p>
          </div>
          {saveSuccess && (
            <Badge variant="success" className="px-3 py-1">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Settings Saved Successfully
            </Badge>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          {[
            { id: "gateway", label: "SMS Gateway (ZendSMS)", icon: Server },
            { id: "general", label: "Organization & Tracking", icon: Globe },
            { id: "team", label: "Team Members & RBAC", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: SMS Gateway (ZendSMS) */}
        {activeTab === "gateway" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>ZendSMS Gateway Credentials</CardTitle>
                  <CardDescription>
                    Official ZendSMS API (app.zendsms.com) for high-deliverability Bangladesh messaging
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-700">ZendSMS Active</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Account Balance / Credits Display */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/40 rounded-xl border border-blue-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                      {balance !== null ? "Custom ZendSMS API Balance" : "Workspace SMS Credits"}
                    </span>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-baseline gap-1.5">
                      {balance !== null ? (
                        <>
                          <span>৳{formatNumber(balance)}</span>
                          <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">BDT</span>
                        </>
                      ) : (
                        <>
                          <span>{formatNumber(smsCredits)}</span>
                          <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Credits Available</span>
                        </>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {balance !== null
                        ? "Connected via custom ZendSMS API credentials."
                        : "Managed via SMSPro Central Gateway (1 Credit = 1 SMS)."}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {smsCredits === 0 && balance === null && (
                      <Link href="/profile">
                        <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Claim 50 Free SMS</span>
                        </Button>
                      </Link>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        setIsCheckingBalance(true);
                        try {
                          const res = await fetch("/api/settings");
                          const json = await res.json();
                          if (typeof json.balance !== "undefined") setBalance(json.balance);
                          if (typeof json.smsCredits !== "undefined") setSmsCredits(json.smsCredits);
                        } finally {
                          setIsCheckingBalance(false);
                        }
                      }}
                      isLoading={isCheckingBalance}
                      className="gap-1.5 text-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh Balance</span>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Custom API Key (BYOK - Optional)
                    </label>
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk_ago... (Leave empty to use shared gateway)"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Leave empty to use SMSPro Central Gateway with your workspace credits.
                    </span>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Approved Sender ID (CLI)</label>
                    <input
                      type="text"
                      value={senderId}
                      onChange={(e) => setSenderId(e.target.value)}
                      placeholder="8809612781020"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Send SMS API Endpoint</label>
                  <input
                    type="url"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400"
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button onClick={handleSaveSettings} isLoading={isSaving} variant="primary">
                  Save Gateway Settings
                </Button>
              </CardFooter>
            </Card>

            {/* Test SMS Dispatcher */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Test SMS Dispatcher</CardTitle>
                  <CardDescription>Send a real test SMS message via ZendSMS API to verify connection</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Destination Phone Number</label>
                    <input
                      type="text"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="88017XXXXXXXX"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Message Body</label>
                    <input
                      type="text"
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-mono ${
                      testResult.success
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                        : "bg-rose-50 text-rose-900 border-rose-200"
                    }`}
                  >
                    <div className="font-bold font-sans">
                      {testResult.success ? "✓ Message Dispatched Successfully" : "✕ Dispatch Failed"}
                    </div>
                    <pre className="mt-1 text-[11px] overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-end">
                <Button onClick={handleSendTestSms} isLoading={isSendingTest} variant="primary" className="gap-2">
                  <Send className="w-4 h-4" />
                  <span>Send Test SMS</span>
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Tab 2: General & Tracking */}
        {activeTab === "general" && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>General Organization & Tracking Config</CardTitle>
                <CardDescription>Setup brand name, tracking domain, and short ID preferences</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Sender ID</label>
                  <input
                    type="text"
                    value={defaultSenderId}
                    onChange={(e) => setDefaultSenderId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Custom Tracking Domain</label>
                  <input
                    type="text"
                    value={trackingDomain}
                    onChange={(e) => setTrackingDomain(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Default Tracking ID Length: {trackingLength} chars
                </label>
                <input
                  type="range"
                  min="3"
                  max="8"
                  value={trackingLength}
                  onChange={(e) => setTrackingLength(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleSaveSettings} isLoading={isSaving} variant="primary">
                Save General Settings
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Tab 3: Team Members & RBAC */}
        {activeTab === "team" && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Team Members & Permissions (RBAC)</CardTitle>
                <CardDescription>Workspace user roles: Owner (Full Access) and Admin</CardDescription>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-4 py-3.5">Email</th>
                    <th className="px-4 py-3.5">Phone</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {teamMembers && teamMembers.length > 0 ? (
                    teamMembers.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{m.name}</td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{m.email}</td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{m.phone || "—"}</td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold uppercase text-[10px]">
                            {m.role || "Owner"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="success" className="capitalize">
                            {m.status || "active"}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        Loading workspace team members...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
