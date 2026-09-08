"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
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
  Download,
  Trash2,
  Check,
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
    isRetargeting ? "High-Intent Leads Segment" : "CSV Upload Contact List"
  );
  const [recipientCount, setRecipientCount] = useState(0);
  const [destinationUrl, setDestinationUrl] = useState("https://mybrand.com/offer");
  const [trackingFormat, setTrackingFormat] = useState<"numeric" | "alphanumeric">("numeric");
  const [trackingLength, setTrackingLength] = useState(6);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedContacts, setUploadedContacts] = useState<{ phone: string; name?: string; customId?: string }[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const smsStats = calculateSmsSegments(message);

  const parseContactText = (text: string, filename: string = "contacts.csv") => {
    setUploadError(null);
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setUploadError("The uploaded file is empty.");
      return;
    }

    const firstLine = lines[0].toLowerCase();
    const hasHeader =
      firstLine.includes("phone") ||
      firstLine.includes("mobile") ||
      firstLine.includes("number") ||
      firstLine.includes("contact") ||
      firstLine.includes("name") ||
      firstLine.includes("custom_id");

    let phoneIdx = 0;
    let nameIdx = -1;
    let idIdx = -1;
    let dataLines = lines;

    if (hasHeader) {
      const headers = lines[0]
        .split(/[,\t;|]/)
        .map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));
      phoneIdx = headers.findIndex(
        (h) => h.includes("phone") || h.includes("mobile") || h.includes("number") || h.includes("contact")
      );
      nameIdx = headers.findIndex((h) => h.includes("name") && !h.includes("custom"));
      idIdx = headers.findIndex((h) => h.includes("id") || h.includes("custom"));
      if (phoneIdx === -1) phoneIdx = 0;
      dataLines = lines.slice(1);
    }

    const parsed: { phone: string; name?: string; customId?: string }[] = [];
    const seenPhones = new Set<string>();

    for (const line of dataLines) {
      const cols = line.split(/[,\t;|]/).map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const rawPhone = cols[phoneIdx] || cols[0];
      if (!rawPhone) continue;

      const cleaned = rawPhone.replace(/[^\d+]/g, "");
      if (cleaned.length >= 7) {
        const cName = nameIdx !== -1 ? cols[nameIdx] : cols[1] && isNaN(Number(cols[1])) ? cols[1] : undefined;
        const customId = idIdx !== -1 ? cols[idIdx] : undefined;

        if (!seenPhones.has(cleaned)) {
          seenPhones.add(cleaned);
          parsed.push({ phone: cleaned, name: cName, customId });
        }
      }
    }

    if (parsed.length === 0) {
      setUploadError("No valid phone numbers found in file. Ensure phone numbers are provided (e.g. 017XXXXXXXX or 88017XXXXXXXX).");
      return;
    }

    setUploadedContacts(parsed);
    setRecipientCount(parsed.length);
    setAudienceName(`${filename} (${parsed.length} contacts)`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseContactText(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseContactText(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadedContacts([]);
    setRecipientCount(0);
    setAudienceName("CSV Upload Contact List");
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadSampleCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent("phone,name,custom_id\n8801711234567,Rahim Ahmed,USR-101\n8801812345678,Karim Uddin,USR-102\n8801912345679,Farhana Islam,USR-103\n8801612345670,Tanvir Hasan,USR-104\n");
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "smspro_contacts_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          contacts: audienceType === "upload" ? uploadedContacts : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
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

  const sampleTrackingUrl = `http://localhost:3000/t/${trackingFormat === "numeric" ? "583214" : "A8K72P"}`;
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
              Retargeting Mode
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
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold leading-tight">{s.label}</div>
                  <div className="text-[10px] text-slate-400">Step {s.num} of 4</div>
                </div>
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
                  placeholder="e.g. Flash Weekend 20% Discount"
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
                  <option value="SMSPRO">SMSPRO</option>
                  <option value="MYBRAND">MYBRAND</option>
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
              <CardDescription>Select target contact list, upload spreadsheet, or choose an audience segment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                  onClick={() => {
                    setAudienceType("upload");
                    setAudienceName(uploadedContacts.length > 0 ? `${uploadedFile?.name || "Uploaded List"} (${uploadedContacts.length} contacts)` : "CSV Upload Contact List");
                    setRecipientCount(uploadedContacts.length);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    audienceType === "upload"
                      ? "border-blue-500 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <UploadCloud className="w-5 h-5 text-blue-600 mb-2" />
                  <div className="font-semibold text-xs text-slate-900">Upload CSV / XLSX</div>
                  <div className="text-[11px] text-slate-500 mt-1">Import phone contacts from file</div>
                </div>

                <div
                  onClick={() => {
                    setAudienceType("existing");
                    setAudienceName("Saved Database Contacts");
                    setRecipientCount(100);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    audienceType === "existing"
                      ? "border-blue-500 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Users className="w-5 h-5 text-slate-600 mb-2" />
                  <div className="font-semibold text-xs text-slate-900">Existing Audience</div>
                  <div className="text-[11px] text-slate-500 mt-1">Target saved database contacts</div>
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
              </div>

              {/* CSV Upload Dropzone */}
              {audienceType === "upload" && (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.xlsx,.xls,.tsv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  {uploadedContacts.length === 0 ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-8 border-2 border-dashed rounded-xl text-center space-y-2 cursor-pointer transition-all ${
                        isDragging
                          ? "border-blue-500 bg-blue-50/70"
                          : "border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50"
                      }`}
                    >
                      <UploadCloud className="w-10 h-10 text-blue-500 mx-auto" />
                      <div className="text-xs font-semibold text-slate-800">
                        Click to Browse or Drag & Drop your CSV / XLSX contact file
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Supported formats: .csv, .txt, .xlsx. Columns: <code>phone</code>, <code>name</code>, <code>custom_id</code>
                      </p>
                      <div className="pt-2 flex items-center justify-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                        >
                          Select File
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadSampleCsv();
                          }}
                          className="gap-1 text-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Sample CSV Template</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{uploadedFile?.name || "contacts.csv"}</div>
                            <div className="text-[11px] text-emerald-700 font-medium">
                              ✓ {formatNumber(uploadedContacts.length)} valid contacts successfully loaded
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs"
                          >
                            Replace File
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleRemoveFile}
                            className="text-rose-600 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Contact Preview Table */}
                      <div className="bg-white border border-emerald-100 rounded-lg overflow-hidden text-xs">
                        <div className="px-3 py-1.5 bg-slate-50 font-semibold text-slate-600 border-b border-slate-100 text-[11px]">
                          Preview of Loaded Contacts (Showing first 5 of {uploadedContacts.length}):
                        </div>
                        <table className="w-full text-left">
                          <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/50">
                            <tr>
                              <th className="px-3 py-1.5">#</th>
                              <th className="px-3 py-1.5">Phone</th>
                              <th className="px-3 py-1.5">Name</th>
                              <th className="px-3 py-1.5">Custom ID</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                            {uploadedContacts.slice(0, 5).map((c, i) => (
                              <tr key={i}>
                                <td className="px-3 py-1.5 font-sans text-slate-400">{i + 1}</td>
                                <td className="px-3 py-1.5 font-semibold text-slate-800">{c.phone}</td>
                                <td className="px-3 py-1.5 font-sans text-slate-600">{c.name || "-"}</td>
                                <td className="px-3 py-1.5 text-slate-500">{c.customId || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                      <span>{uploadError}</span>
                    </div>
                  )}
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
              <Button
                onClick={() => setStep(3)}
                disabled={audienceType === "upload" && uploadedContacts.length === 0}
              >
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tracking ID Format</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTrackingFormat("numeric")}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                        trackingFormat === "numeric"
                          ? "bg-blue-50 border-blue-500 text-blue-700 shadow-xs"
                          : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      Numeric (e.g. 583214)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrackingFormat("alphanumeric")}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                        trackingFormat === "alphanumeric"
                          ? "bg-blue-50 border-blue-500 text-blue-700 shadow-xs"
                          : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      Alphanumeric (e.g. A8K72P)
                    </button>
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
                    className="w-full mt-2"
                  />
                </div>
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
              <Button onClick={() => setStep(4)} disabled={!destinationUrl}>
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
                    <span className="text-slate-400 block">Audience / Contacts:</span>
                    <strong className="text-slate-900 text-sm">{formatNumber(recipientCount)} Recipients</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Gateway Provider:</span>
                    <strong className="text-blue-700 text-sm">BulkSMSBD (Live API)</strong>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-700">Destination URL:</span>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-blue-600 font-mono text-xs">
                    {destinationUrl}
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
