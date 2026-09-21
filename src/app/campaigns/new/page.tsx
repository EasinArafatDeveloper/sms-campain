"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { calculateSmsSegments, formatNumber, normalizePhoneNumber } from "@/lib/utils";
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
  ClipboardList,
  Copy,
  CheckCheck,
  FileSpreadsheet,
} from "lucide-react";
import { BRAND } from "@/lib/brand";

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
  const [senderId, setSenderId] = useState("8809612781020");
  const [message, setMessage] = useState(
    "Special offer is live! Get 20% discount today. Click here: {TRACKABLE_LINK}"
  );
  const [audienceType, setAudienceType] = useState<"existing" | "upload" | "paste" | "segment">(
    isRetargeting ? "segment" : "upload"
  );
  const [audienceName, setAudienceName] = useState(
    isRetargeting ? "High-Intent Leads Segment" : "CSV Upload Contact List"
  );
  const [recipientCount, setRecipientCount] = useState(0);
  const [destinationUrl, setDestinationUrl] = useState("https://yourwebsite.com/offer");
  const [trackingFormat, setTrackingFormat] = useState<"numeric" | "alphanumeric">("alphanumeric");
  const [trackingLength, setTrackingLength] = useState(6);
  const [urlPrefix, setUrlPrefix] = useState("eid");
  const [linkStyle, setLinkStyle] = useState<"hyphen" | "slash" | "direct">("hyphen");

  // Message & Ref State
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedContacts, setUploadedContacts] = useState<{ phone: string; name?: string; customId?: string }[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Copy-Paste Numbers State
  const [pastedText, setPastedText] = useState("");
  const [pastedStats, setPastedStats] = useState<{ total: number; valid: number; duplicates: number; invalid: number }>({
    total: 0,
    valid: 0,
    duplicates: 0,
    invalid: 0,
  });
  const [copiedNotification, setCopiedNotification] = useState(false);

  const smsStats = calculateSmsSegments(message);

  const handleInsertMergeTag = (tag: string = "{TRACKABLE_LINK}") => {
    const textarea = messageTextareaRef.current;
    if (!textarea) {
      setMessage((prev) => `${prev} ${tag}`);
      return;
    }

    const start = textarea.selectionStart ?? message.length;
    const end = textarea.selectionEnd ?? message.length;
    const before = message.substring(0, start);
    const after = message.substring(end);

    // Ensure sensible spacing before and after the tag
    const needsSpaceBefore = before.length > 0 && !before.endsWith(" ") && !before.endsWith("\n");
    const needsSpaceAfter = after.length > 0 && !after.startsWith(" ") && !after.startsWith("\n");
    const insertion = `${needsSpaceBefore ? " " : ""}${tag}${needsSpaceAfter ? " " : ""}`;

    const newMessage = before + insertion + after;
    setMessage(newMessage);

    // Restore cursor position right after the inserted tag
    setTimeout(() => {
      textarea.focus();
      const newPos = start + insertion.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 50);
  };

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

  const handlePasteParse = (text: string) => {
    setPastedText(text);
    setUploadError(null);

    if (!text.trim()) {
      setUploadedContacts([]);
      setRecipientCount(0);
      setPastedStats({ total: 0, valid: 0, duplicates: 0, invalid: 0 });
      setAudienceName("Pasted Contact List");
      return;
    }

    const rawItems = text.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
    let totalProcessed = 0;
    let validCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;

    const parsed: { phone: string; name?: string; customId?: string }[] = [];
    const seenPhones = new Set<string>();

    for (const line of rawItems) {
      const cols = line.split(/[,\t;|]/).map((c) => c.trim().replace(/^["']|["']$/g, ""));

      // If line is multiple inline comma-separated numbers (e.g. 01711111111, 01822222222, 01933333333)
      if (cols.length > 1 && cols.every((c) => /^[+0-9\s-]{7,}$/.test(c))) {
        for (const num of cols) {
          totalProcessed++;
          const { normalized, isValid } = normalizePhoneNumber(num);
          if (isValid) {
            if (seenPhones.has(normalized)) {
              duplicateCount++;
            } else {
              seenPhones.add(normalized);
              parsed.push({ phone: normalized });
              validCount++;
            }
          } else {
            invalidCount++;
          }
        }
        continue;
      }

      totalProcessed++;
      const rawPhone = cols[0];
      const name = cols[1] && isNaN(Number(cols[1])) ? cols[1] : undefined;
      const customId = cols[2] || undefined;

      const { normalized, isValid } = normalizePhoneNumber(rawPhone);
      if (isValid) {
        if (seenPhones.has(normalized)) {
          duplicateCount++;
        } else {
          seenPhones.add(normalized);
          parsed.push({ phone: normalized, name, customId });
          validCount++;
        }
      } else {
        invalidCount++;
      }
    }

    setUploadedContacts(parsed);
    setRecipientCount(parsed.length);
    setPastedStats({
      total: totalProcessed,
      valid: validCount,
      duplicates: duplicateCount,
      invalid: invalidCount,
    });
    setAudienceName(`Pasted Contact List (${parsed.length} contacts)`);

    if (parsed.length === 0 && totalProcessed > 0) {
      setUploadError("No valid phone numbers detected. Enter numbers like 017XXXXXXXX, 88018XXXXXXXX, or +88019XXXXXXXX.");
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handlePasteParse(text);
          setCopiedNotification(true);
          setTimeout(() => setCopiedNotification(false), 2500);
        }
      }
    } catch (err) {
      console.warn("Clipboard access denied or unavailable", err);
    }
  };

  const handleLoadSampleNumbers = () => {
    const sample = `01711234567, Rahim Ahmed, USR-101
8801812345678, Karim Uddin, USR-102
+8801912345679, Farhana Islam, USR-103
01612345670, Tanvir Hasan, USR-104
01512345671, Nusrat Jahan, USR-105`;
    handlePasteParse(sample);
  };

  const handleClearPasted = () => {
    setPastedText("");
    setUploadedContacts([]);
    setRecipientCount(0);
    setPastedStats({ total: 0, valid: 0, duplicates: 0, invalid: 0 });
    setAudienceName("Pasted Contact List");
    setUploadError(null);
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
    link.setAttribute("download", `${BRAND.slug}_contacts_sample.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLaunchCampaign = async () => {
    setIsSubmitting(true);
    try {
      const rawPrefix = (urlPrefix || "").trim().replace(/^\/+|\/+$/g, "").toLowerCase();
      const finalPrefix = rawPrefix || (linkStyle === "direct" ? "" : "eid");

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
          urlPrefix: finalPrefix,
          linkStyle,
          contacts: (audienceType === "upload" || audienceType === "paste") ? uploadedContacts : undefined,
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

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const rawPrefix = (urlPrefix || "").trim().replace(/^\/+|\/+$/g, "").toLowerCase();
  const activePrefix = rawPrefix || (linkStyle === "direct" ? "" : "eid");
  const sampleTrackingId = React.useMemo(() => {
    if (trackingFormat === "numeric") {
      const digits = "583214976023";
      return digits.slice(0, Math.max(3, Math.min(10, trackingLength)));
    } else {
      const chars = "a8k72p9mx4hq";
      return chars.slice(0, Math.max(3, Math.min(10, trackingLength)));
    }
  }, [trackingFormat, trackingLength]);

  const samplePath = React.useMemo(() => {
    if (linkStyle === "hyphen" && activePrefix) {
      return `${activePrefix}-${sampleTrackingId}`;
    }
    if (linkStyle === "slash" && activePrefix) {
      return `${activePrefix}/${sampleTrackingId}`;
    }
    return sampleTrackingId;
  }, [linkStyle, activePrefix, sampleTrackingId]);

  const sampleTrackingUrl = `${origin}/${samplePath}`;
  const sampleMessage = message.replace(/\{(?:TRACKABLE_LINK|link|url|track_link|tracking_link)\}/gi, sampleTrackingUrl);
  const hasLinkTag = /\{(?:TRACKABLE_LINK|link|url|track_link|tracking_link)\}/i.test(message);

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
                  <option value="8809612781020">8809612781020 (Official ZendSMS Sender ID)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Sender IDs registered with ZendSMS gateway.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1.5">
                  <label className="block text-xs font-semibold text-slate-700">SMS Message Copy</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 hidden sm:inline">Insert at cursor:</span>
                    <button
                      type="button"
                      onClick={() => handleInsertMergeTag("{TRACKABLE_LINK}")}
                      className="text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                    >
                      <Link2 className="w-3 h-3" /> &#123;TRACKABLE_LINK&#125;
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertMergeTag("{link}")}
                      className="text-[11px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                    >
                      <Link2 className="w-3 h-3" /> &#123;link&#125;
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertMergeTag("{name}")}
                      className="text-[11px] bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                    >
                      <Users className="w-3 h-3" /> &#123;name&#125;
                    </button>
                  </div>
                </div>
                <textarea
                  ref={messageTextareaRef}
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="Type message here... e.g. 2026 new offer unlock {link} end date offer 12 march"
                />

                {/* SMS Segmentation Bar */}
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex-wrap gap-2">
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
                  {hasLinkTag ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Merge tag included
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Missing link merge tag &#123;link&#125; or &#123;TRACKABLE_LINK&#125;
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={() => setStep(2)} disabled={!name || !hasLinkTag}>
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
              <CardDescription>Upload contact spreadsheet, directly copy-paste numbers, or target existing audience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Audience Type Selection Tabs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div
                  onClick={() => {
                    setAudienceType("upload");
                    setAudienceName(uploadedContacts.length > 0 && uploadedFile ? `${uploadedFile.name} (${uploadedContacts.length} contacts)` : "CSV Upload Contact List");
                    setRecipientCount(uploadedFile ? uploadedContacts.length : 0);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    audienceType === "upload"
                      ? "border-blue-500 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <UploadCloud className="w-5 h-5 text-blue-600 mb-2" />
                  <div className="font-semibold text-xs text-slate-900">Upload File</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">CSV, TXT, TSV file</div>
                </div>

                <div
                  onClick={() => {
                    setAudienceType("paste");
                    setAudienceName(pastedStats.valid > 0 ? `Pasted Contact List (${pastedStats.valid} contacts)` : "Pasted Contact List");
                    setRecipientCount(pastedStats.valid);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    audienceType === "paste"
                      ? "border-blue-500 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <ClipboardList className="w-5 h-5 text-indigo-600 mb-2" />
                  <div className="font-semibold text-xs text-slate-900">Copy & Paste</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Paste numbers directly</div>
                </div>

                <div
                  onClick={() => {
                    setAudienceType("existing");
                    setAudienceName("Saved Database Contacts");
                    setRecipientCount(100);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    audienceType === "existing"
                      ? "border-blue-500 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <Users className="w-5 h-5 text-slate-600 mb-2" />
                  <div className="font-semibold text-xs text-slate-900">Existing Audience</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Saved database contacts</div>
                </div>

                <div
                  onClick={() => {
                    setAudienceType("segment");
                    setAudienceName("High-Intent Leads Segment");
                    setRecipientCount(50);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    audienceType === "segment"
                      ? "border-purple-500 bg-purple-50/50 shadow-xs ring-2 ring-purple-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-purple-600 mb-2" />
                  <div className="font-semibold text-xs text-slate-900">High-Intent Leads</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Multi-click retargeting</div>
                </div>
              </div>

              {/* Option 1: CSV / TXT File Upload */}
              {audienceType === "upload" && (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.tsv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  {uploadedContacts.length === 0 || !uploadedFile ? (
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
                        Click to Browse or Drag & Drop your CSV contact file
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Supported formats: .csv, .txt, .tsv. Columns: <code>phone</code>, <code>name</code>, <code>custom_id</code>
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

              {/* Option 2: Copy & Paste Phone Numbers */}
              {audienceType === "paste" && (
                <div className="p-4.5 rounded-xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 to-white space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-indigo-100">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <ClipboardList className="w-4 h-4 text-indigo-600" />
                        <span>Direct Copy & Paste Numbers (নাম্বার কপি ও পেস্ট করুন)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Paste numbers separated by newline, comma, or space. Optional: <code>017XXXXXXXX, Name, ID</code>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePasteFromClipboard}
                        className="text-[11px] h-7 px-2.5 bg-white border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-semibold gap-1 shadow-2xs"
                      >
                        {copiedNotification ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Pasted!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Paste from Clipboard</span>
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleLoadSampleNumbers}
                        className="text-[11px] h-7 px-2.5 text-slate-600 hover:text-indigo-600 font-medium gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Sample Numbers</span>
                      </Button>

                      {pastedText && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleClearPasted}
                          className="text-[11px] h-7 px-2 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-0.5" />
                          <span>Clear</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Textarea Input */}
                  <div>
                    <textarea
                      rows={6}
                      value={pastedText}
                      onChange={(e) => handlePasteParse(e.target.value)}
                      placeholder={`01711234567\n8801812345678, Rahim Ahmed\n+8801912345679, Farhana Islam, USR-101\n01612345670\n01512345671`}
                      className="w-full p-3.5 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-inner leading-relaxed"
                    />
                  </div>

                  {/* Live Parsing Metrics & Badges */}
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <strong>{formatNumber(pastedStats.valid)}</strong> Valid Numbers
                      </span>
                      {pastedStats.duplicates > 0 && (
                        <span className="flex items-center gap-1 font-medium text-amber-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          {formatNumber(pastedStats.duplicates)} Duplicates Removed
                        </span>
                      )}
                      {pastedStats.invalid > 0 && (
                        <span className="flex items-center gap-1 font-medium text-rose-700">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {formatNumber(pastedStats.invalid)} Invalid Formats
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-indigo-700 font-medium">
                      Auto-Normalizes <code>017...</code> → <code>88017...</code>
                    </div>
                  </div>

                  {/* Preview Table of Pasted Contacts */}
                  {uploadedContacts.length > 0 && (
                    <div className="bg-white border border-indigo-100 rounded-lg overflow-hidden text-xs shadow-2xs">
                      <div className="px-3 py-1.5 bg-slate-50 font-semibold text-slate-700 border-b border-slate-100 text-[11px] flex items-center justify-between">
                        <span>Preview of Pasted Contacts (Showing first 5 of {uploadedContacts.length}):</span>
                        <span className="text-[10px] text-emerald-600 font-bold">✓ Ready for Campaign</span>
                      </div>
                      <table className="w-full text-left">
                        <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/50 border-b border-slate-100">
                          <tr>
                            <th className="px-3 py-1.5">#</th>
                            <th className="px-3 py-1.5">Normalized Phone</th>
                            <th className="px-3 py-1.5">Contact Name</th>
                            <th className="px-3 py-1.5">Custom ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {uploadedContacts.slice(0, 5).map((c, i) => (
                            <tr key={i} className="hover:bg-indigo-50/30">
                              <td className="px-3 py-1.5 font-sans text-slate-400">{i + 1}</td>
                              <td className="px-3 py-1.5 font-semibold text-indigo-900">{c.phone}</td>
                              <td className="px-3 py-1.5 font-sans text-slate-600">{c.name || "-"}</td>
                              <td className="px-3 py-1.5 text-slate-500">{c.customId || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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

              {/* Audience Summary Banner */}
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
                disabled={
                  (audienceType === "upload" && uploadedContacts.length === 0) ||
                  (audienceType === "paste" && uploadedContacts.length === 0)
                }
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
                  placeholder="https://yourwebsite.com/special-offer"
                />
                <p className="text-[11px] text-slate-400 mt-1">Users clicking the SMS short link will redirect here.</p>
              </div>

              {/* Link URL Structure & Custom Prefix */}
              <div className="p-4 rounded-xl border border-blue-200/80 bg-blue-50/40 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Link URL Style (লিংক ফরম্যাট স্টাইল)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setLinkStyle("hyphen")}
                      className={`p-2 text-left rounded-lg border transition-all cursor-pointer ${
                        linkStyle === "hyphen"
                          ? "bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-xs"
                          : "bg-white/70 border-slate-200 hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      <div className="text-[11px] font-bold text-slate-900 flex items-center justify-between">
                        <span>Hyphenated</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-700 font-semibold">Recommended</span>
                      </div>
                      <div className="font-mono text-[10px] text-blue-600 mt-0.5 truncate">
                        /{activePrefix || "eid"}-{sampleTrackingId}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLinkStyle("slash")}
                      className={`p-2 text-left rounded-lg border transition-all cursor-pointer ${
                        linkStyle === "slash"
                          ? "bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-xs"
                          : "bg-white/70 border-slate-200 hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      <div className="text-[11px] font-bold text-slate-900">Directory Slash</div>
                      <div className="font-mono text-[10px] text-blue-600 mt-0.5 truncate">
                        /{activePrefix || "eid"}/{sampleTrackingId}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLinkStyle("direct")}
                      className={`p-2 text-left rounded-lg border transition-all cursor-pointer ${
                        linkStyle === "direct"
                          ? "bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-xs"
                          : "bg-white/70 border-slate-200 hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      <div className="text-[11px] font-bold text-slate-900">Direct Code</div>
                      <div className="font-mono text-[10px] text-blue-600 mt-0.5 truncate">
                        /{sampleTrackingId}
                      </div>
                    </button>
                  </div>
                </div>

                {linkStyle !== "direct" && (
                  <div className="space-y-2 pt-1 border-t border-blue-100">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700">
                        Custom Keyword / Prefix (কাস্টম নাম বা কিওয়ার্ড)
                      </label>
                      <span className="text-[11px] text-blue-700 font-mono font-bold">
                        {linkStyle === "hyphen" ? `/${activePrefix || "eid"}-[code]` : `/${activePrefix || "eid"}/[code]`}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-slate-200 bg-slate-100 text-slate-500 font-mono text-xs">
                        {origin.replace(/^https?:\/\//, "")}/
                      </span>
                      <input
                        type="text"
                        value={urlPrefix}
                        onChange={(e) => {
                          const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "");
                          setUrlPrefix(clean);
                        }}
                        placeholder="e.g. eid, offer, deal, summer"
                        className="w-full px-3 py-2 text-xs font-mono font-bold text-blue-700 border border-slate-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[11px] text-slate-500">Quick presets:</span>
                      {["eid", "offer", "deal", "promo", "vip", "sale", "t"].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setUrlPrefix(preset)}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border transition-all cursor-pointer ${
                            activePrefix === preset
                              ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tracking ID Format</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTrackingFormat("alphanumeric")}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        trackingFormat === "alphanumeric"
                          ? "bg-blue-50 border-blue-500 text-blue-700 shadow-xs ring-2 ring-blue-500/20"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      Alphanumeric (e.g. {"a8k72p9m".slice(0, trackingLength)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrackingFormat("numeric")}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        trackingFormat === "numeric"
                          ? "bg-blue-50 border-blue-500 text-blue-700 shadow-xs ring-2 ring-blue-500/20"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      Numeric (e.g. {"58321497".slice(0, trackingLength)})
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Character Length: <span className="text-blue-600 font-bold font-mono">{trackingLength} chars</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {trackingFormat === "alphanumeric"
                        ? trackingLength === 3
                          ? "~29.7K combinations"
                          : trackingLength === 4
                          ? "~14.7M combinations"
                          : trackingLength === 5
                          ? "~916M combinations"
                          : trackingLength === 6
                          ? "~56.8B combinations"
                          : trackingLength === 7
                          ? "~3.5 Trillion"
                          : "~218 Trillion"
                        : `${Math.pow(10, trackingLength).toLocaleString()} combinations`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-2">
                    {[3, 4, 5, 6, 7, 8].map((len) => (
                      <button
                        key={len}
                        type="button"
                        onClick={() => setTrackingLength(len)}
                        className={`flex-1 py-1 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                          trackingLength === len
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {len}
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min="3"
                    max="8"
                    value={trackingLength}
                    onChange={(e) => setTrackingLength(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-600 cursor-pointer"
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
                    <strong className="text-blue-700 text-sm">ZendSMS (Live API)</strong>
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
