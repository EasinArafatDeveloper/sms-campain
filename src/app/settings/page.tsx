"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "gateway" | "team">("gateway");

  // State
  const [orgName, setOrgName] = useState("SMSPro Enterprise");
  const [defaultSenderId, setDefaultSenderId] = useState("8809648910379");
  const [trackingDomain, setTrackingDomain] = useState("https://go.mybrand.com");
  const [trackingLength, setTrackingLength] = useState(6);

  // SMS Gateway Config (BulkSMSBD)
  const [apiKey, setApiKey] = useState("xkp2EbUxxu2vRtC6ycRE");
  const [senderId, setSenderId] = useState("8809648910379");
  const [apiUrl, setApiUrl] = useState("http://bulksmsbd.net/api/smsapi");
  const [balance, setBalance] = useState<number | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  // Test SMS State
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Test SMS verification from SMSPro Gateway.");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.organization) {
          setOrgName(data.organization.name || "SMSPro Enterprise");
          setDefaultSenderId(data.organization.defaultSenderId || "8809648910379");
          setTrackingDomain(data.organization.trackingDomain || "https://go.mybrand.com");
        }
        if (data.providerConfig) {
          setApiKey(data.providerConfig.apiKey || "xkp2EbUxxu2vRtC6ycRE");
          setSenderId(data.providerConfig.senderId || "8809648910379");
          setApiUrl(data.providerConfig.apiUrl || "http://bulksmsbd.net/api/smsapi");
        }
        if (typeof data.balance !== "undefined") {
          setBalance(data.balance);
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
            provider: "bulksmsbd",
            name: "BulkSMSBD Primary",
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
            { id: "gateway", label: "SMS Gateway (BulkSMSBD)", icon: Server },
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

        {/* Tab 1: SMS Gateway (BulkSMSBD) */}
        {activeTab === "gateway" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>BulkSMSBD Gateway Credentials</CardTitle>
                  <CardDescription>
                    Official SMS Gateway API for high-deliverability Bangladesh messaging
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-700">Gateway Active</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Account Balance Alert */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-[11px] font-semibold uppercase">BulkSMSBD Credit Balance</span>
                    <div className="text-2xl font-bold text-slate-900 mt-0.5">
                      {formatNumber(balance)} <span className="text-xs font-semibold text-blue-700">BDT</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setIsCheckingBalance(true);
                      try {
                        const res = await fetch("/api/delivery-queue/health");
                        const json = await res.json();
                        if (typeof json.balance !== "undefined") setBalance(json.balance);
                      } finally {
                        setIsCheckingBalance(false);
                      }
                    }}
                    isLoading={isCheckingBalance}
                    className="gap-1.5 text-xs"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Check Live Balance</span>
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">API Key</label>
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Approved Sender ID</label>
                    <input
                      type="text"
                      value={senderId}
                      onChange={(e) => setSenderId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Send SMS API Endpoint</label>
                  <input
                    type="url"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-600"
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
                  <CardDescription>Send a real test SMS message via BulkSMSBD API to verify connection</CardDescription>
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
                  min="4"
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
                <CardDescription>Manage user roles across Owner, Admin, Manager, Analyst, and Viewer</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                + Invite Member
              </Button>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-4 py-3.5">Email</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {[
                    { name: "Omer Sharif", email: "omer@smspro.io", role: "Owner", status: "active" },
                    { name: "Sarah Jenkins", email: "sarah@smspro.io", role: "Manager", status: "active" },
                    { name: "Technical Operations", email: "dev@smspro.io", role: "Admin", status: "active" },
                  ].map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4 font-semibold text-slate-900">{m.name}</td>
                      <td className="px-4 py-4 text-slate-600">{m.email}</td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                          {m.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="success">Active</Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-blue-600 font-semibold cursor-pointer hover:underline">
                        Edit
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
