"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { calculateSmsSegments, formatNumber } from "@/lib/utils";
import {
  Send,
  Users,
  Link2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  FileText,
  AlertCircle,
  Smartphone,
} from "lucide-react";

export default function CreateCampaignPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading campaign wizard...</div>}>
      <CreateCampaignForm />
    </Suspense>
  );
}

function CreateCampaignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRetargeting = searchParams.get("source") === "retargeting";

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState(
    isRetargeting ? "High-Intent VIP Retargeting" : ""
  );
  const [senderId, setSenderId] = useState("8809648910379");
  const [message, setMessage] = useState(
    "Special offer is live! Get 20% discount today. Click here: {TRACKABLE_LINK}"
  );
  const [audienceType, setAudienceType] = useState<"existing" | "upload" | "segment">(
    isRetargeting ? "segment" : "upload"
  );
  const [audienceName, setAudienceName] = useState(
    isRetargeting ? "Highly Active Segment" : "Customer Contact List"
  );
  const [recipientCount, setRecipientCount] = useState(0);
  const [destinationUrl, setDestinationUrl] = useState("https://mybrand.com/offer");
  const [trackingFormat, setTrackingFormat] = useState<"numeric" | "alphanumeric">("numeric");
  const [trackingLength, setTrackingLength] = useState(6);

  const smsStats = calculateSmsSegments(message);

  const handleLaunchCampaign = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          senderId,
          message,
          audienceType,
          audienceName,
          destinationUrl,
          trackingFormat,
          trackingLength,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Navigate to delivery queue or link generator
        router.push(`/link-generator?campaignId=${data.campaign?._id || ""}`);
      } else {
        alert(data.error || "Failed to create campaign");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleTrackingUrl = `https://go.mybrand.com/${trackingFormat === "numeric" ? "583214" : "A8K72P"}`;
  const sampleMessage = message.replace(/\{TRACKABLE_LINK\}/gi, sampleTrackingUrl);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create SMS Campaign</h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure your campaign, select audience, and generate trackable URLs for every recipient.
            </p>
          </div>
          {isRetargeting && (
            <Badge variant="purple" className="px-3 py-1 text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Retargeting Mode (77.5% Volume Reduction)
            </Badge>
          )}
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { num: 1, label: "Campaign Details", icon: Send },
            { num: 2, label: "Audience", icon: Users },
            { num: 3, label: "Tracking Link", icon: Link2 },
            { num: 4, label: "Review & Send", icon: CheckCircle2 },
          ].map((s) => {
            const isCurrent = step === s.num;
            const isCompleted = step > s.num;
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${
                  isCurrent
                    ? "bg-blue-50/80 border-blue-300 text-blue-700 shadow-xs"
                    : isCompleted
                    ? "bg-white border-slate-200 text-emerald-600"
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isCurrent
                      ? "bg-blue-600 text-white"
                      : isCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <div className="text-xs font-semibold leading-tight">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Step 1: Campaign Details */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Campaign Details</CardTitle>
              <CardDescription>Define campaign metadata, approved Sender ID, and SMS message copy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Campaign Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. September Product Promotion"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Sender ID</label>
                <select
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="8809648910379">8809648910379 (BulkSMSBD Approved)</option>
                  <option value="MYBRAND">MYBRAND (Alphanumeric Masking)</option>
                  <option value="SMSPRO">SMSPRO</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Sender IDs registered with BulkSMSBD gateway.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">SMS Message</label>
                  <button
                    type="button"
                    onClick={() => setMessage((prev) => `${prev} {TRACKABLE_LINK}`)}
                    className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    + Insert &#123;TRACKABLE_LINK&#125;
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="Type message here... Include {TRACKABLE_LINK}"
                />

                {/* SMS Segmentation Bar */}
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-4">
                    <span>
                      Characters: <strong className="text-slate-900">{smsStats.characters}</strong>
                    </span>
                    <span>
                      Segments: <strong className="text-slate-900">{smsStats.segments} SMS</strong>
                    </span>
                    <span>
                      Encoding: <strong>{smsStats.isUnicode ? "Unicode" : "GSM-7 (Standard)"}</strong>
                    </span>
                  </div>
                  {message.includes("{TRACKABLE_LINK}") ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Merge tag included
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Missing &#123;TRACKABLE_LINK&#125;
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={() => setStep(2)} disabled={!name || !message.includes("{TRACKABLE_LINK}")}>
                Next: Audience Selection <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Audience */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Audience Selection</CardTitle>
              <CardDescription>Select target contact list or AI-identified lead segment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                  onClick={() => {
                    setAudienceType("existing");
                    setAudienceName("Default Customer Database");
                    setRecipientCount(100);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    audienceType === "existing"
                      ? "border-blue-500 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Users className="w-5 h-5 text-blue-600 mb-2" />
                  <div className="font-semibold text-xs text-slate-900">Existing Audience</div>
                  <div className="text-[11px] text-slate-500 mt-1">Target all saved contacts in database</div>
                </div>

                <div
                  onClick={() => {
                    setAudienceType("segment");
                    setAudienceName("High-Intent Leads Segment");
                    setRecipientCount(50);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    audienceType === "segment"
                      ? "border-purple-500 bg-purple-50/50 shadow-xs ring-2 ring-purple-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-purple-600 mb-2" />
                  <div className="font-semibold text-xs text-slate-900">High-Intent Leads</div>
                  <div className="text-[11px] text-slate-500 mt-1">Multi-click engaged recipients</div>
                </div>

                <div
                  onClick={() => {
                    setAudienceType("upload");
                    setAudienceName("CSV Upload List");
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    audienceType === "upload"
                      ? "border-blue-500 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <UploadCloud className="w-5 h-5 text-slate-600 mb-2" />
                  <div className="font-semibold text-xs text-slate-900">Upload CSV / XLSX</div>
                  <div className="text-[11px] text-slate-500 mt-1">Import fresh spreadsheet contacts</div>
                </div>
              </div>

              {audienceType === "upload" && (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2 bg-slate-50/50">
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-xs font-semibold text-slate-700">Drag & Drop your CSV or XLSX contact file</div>
                  <p className="text-[11px] text-slate-400">Supported columns: phone, name, custom_id</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Browse File
                  </Button>
                </div>
              )}

              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-blue-900">Selected Audience:</span> {audienceName}
                </div>
                <div className="font-bold text-blue-700">{formatNumber(recipientCount)} Recipients</div>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Next: Tracking Link Config <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Tracking Link */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Tracking Link Configuration</CardTitle>
              <CardDescription>Setup destination URL and short tracking code generator settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Destination URL</label>
                <input
                  type="url"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://mybrand.com/special-offer"
                />
                <p className="text-[11px] text-slate-400 mt-1">Users clicking the SMS short link will redirect here.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tracking Domain</label>
                  <input
                    type="text"
                    disabled
                    value="https://go.mybrand.com/"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tracking ID Format</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTrackingFormat("numeric")}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                        trackingFormat === "numeric"
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      Numeric (e.g. 583214)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrackingFormat("alphanumeric")}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                        trackingFormat === "alphanumeric"
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      Alphanumeric (e.g. A8K72P)
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Character Length: {trackingLength}</label>
                <input
                  type="range"
                  min="4"
                  max="8"
                  value={trackingLength}
                  onChange={(e) => setTrackingLength(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>

              {/* Sample Generated Link Preview */}
              <div className="p-3 bg-slate-900 text-white rounded-xl text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-blue-400" />
                  <span>Sample URL:</span>
                  <span className="font-mono text-blue-300 font-bold">{sampleTrackingUrl}</span>
                </div>
                <Badge variant="success" className="bg-emerald-500/20 text-emerald-300 border-0">
                  Collision-Proof
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="secondary" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(4)}>
                Next: Review & Send <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 4: Review & Send */}
        {step === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Step 4: Review & Launch Campaign</CardTitle>
                <CardDescription>Confirm your SMS campaign details before queuing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block">Campaign Name:</span>
                    <strong className="text-slate-900 text-sm">{name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Sender ID:</span>
                    <strong className="text-slate-900 text-sm">{senderId}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Recipients:</span>
                    <strong className="text-slate-900 text-sm">{formatNumber(recipientCount)} Users</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Gateway Provider:</span>
                    <strong className="text-blue-700 text-sm">BulkSMSBD (Live API)</strong>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-700">Sample Personalized Message:</span>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-xs leading-relaxed shadow-inner">
                    {sampleMessage}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="secondary" onClick={() => setStep(3)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button onClick={handleLaunchCampaign} isLoading={isSubmitting} variant="primary" className="gap-2">
                  <Send className="w-4 h-4" />
                  <span>Generate Links & Send SMS</span>
                </Button>
              </CardFooter>
            </Card>

            {/* Mobile SMS Preview */}
            <div className="bg-slate-900 p-4 rounded-2xl border-4 border-slate-700 shadow-xl text-white flex flex-col justify-between max-w-xs mx-auto w-full">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px] text-slate-400">
                <span>{senderId}</span>
                <span>Now</span>
              </div>
              <div className="my-6 p-3 bg-blue-600 rounded-2xl rounded-tl-xs text-xs text-white leading-relaxed shadow-sm font-sans">
                {sampleMessage}
              </div>
              <div className="text-center text-[10px] text-slate-500">Live SMS Simulation Preview</div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
