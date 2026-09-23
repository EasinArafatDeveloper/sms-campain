"use client";

import React, { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Notice, PageHeader, Panel, btnPrimary, btnSecondary, tbl } from "@/components/ui/page";
import { TextField } from "@/components/auth/fields";
import { calculateSmsSegments, cn, formatNumber, normalizePhoneNumber } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  Copy,
  Database,
  Download,
  FileText,
  Link2,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  UploadCloud,
  Users,
} from "lucide-react";
import { BRAND } from "@/lib/brand";

export default function CreateCampaignPage() {
  return (
    <Suspense fallback={<AppLayout><div className="p-8 text-center text-sm text-slate-400">Loading…</div></AppLayout>}>
      <CreateCampaignForm />
    </Suspense>
  );
}

const STEPS = [
  { num: 1, label: "Message", icon: Send },
  { num: 2, label: "Audience", icon: Users },
  { num: 3, label: "Link", icon: Link2 },
  { num: 4, label: "Review", icon: CheckCircle2 },
];

const fieldCls =
  "w-full rounded-xl border border-slate-200 bg-white text-base text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-slate-900/70 dark:text-white dark:placeholder:text-slate-500 sm:text-sm";
const labelCls = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200";

function isHttpUrl(v: string) {
  try {
    const u = new URL(v.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** A message bubble inside a small phone, so people see exactly what recipients get. */
function SmsPreview({ sender, text }: { sender: string; text: string }) {
  return (
    <div className="mx-auto w-full max-w-[280px] rounded-[2rem] border border-slate-200 bg-slate-50 p-3 shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-slate-950">
      <div className="rounded-[1.5rem] bg-white p-4 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/10">
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 text-white">
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="max-w-[120px] truncate">{sender}</span>
          </span>
          <span className="text-[11px] text-slate-400">Now</span>
        </div>
        <div className="mt-4 min-h-[96px]">
          <p className="w-fit max-w-full break-words rounded-2xl rounded-tl-md bg-slate-100 px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-800 dark:bg-white/10 dark:text-slate-100">
            {text || "Your message appears here"}
          </p>
        </div>
      </div>
    </div>
  );
}

function CreateCampaignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRetargeting = searchParams.get("source") === "retargeting";
  const reduce = useReducedMotion();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(
    isRetargeting ? "Follow-up campaign" : ""
  );
  const [senderId, setSenderId] = useState("8809612781020");
  const [message, setMessage] = useState(
    "Special offer is live! Get 20% discount today. Click here: {TRACKABLE_LINK}"
  );
  const [audienceType, setAudienceType] = useState<"existing" | "upload" | "paste" | "segment">(
    isRetargeting ? "segment" : "upload"
  );
  const [audienceName, setAudienceName] = useState(
    isRetargeting ? "Saved contacts" : "CSV Upload Contact List"
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
      setUploadError("No valid phone numbers found in this file. Use numbers like 017XXXXXXXX or 88017XXXXXXXX.");
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
    setLaunchError(null);
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
        // Land on the campaign's own page — it's created as a draft (nothing has been
        // sent yet), and this is where the explicit "Send Campaign" action lives.
        router.push(`/campaigns/${data.campaign?._id || ""}`);
      } else {
        setLaunchError(data.error || "The campaign could not be created. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setLaunchError("Something went wrong while creating the campaign. Please try again.");
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

  const usesSaved = audienceType === "existing" || audienceType === "segment";
  const canNext1 = !!name.trim() && hasLinkTag;
  const canNext2 = usesSaved || uploadedContacts.length > 0;
  const canNext3 = isHttpUrl(destinationUrl);
  const audienceLabel = usesSaved ? "All saved contacts" : `${formatNumber(recipientCount)} recipients`;

  const goTo = (n: number) => {
    if (n < step) setStep(n);
  };

  const FooterBar = ({ children }: { children: React.ReactNode }) => (
    <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5 dark:border-white/10">{children}</div>
  );
  const BackBtn = ({ to }: { to: number }) => (
    <button type="button" onClick={() => setStep(to)} className={btnSecondary}>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back
    </button>
  );

  const audienceCards = [
    {
      id: "upload" as const,
      icon: UploadCloud,
      title: "Upload a file",
      body: "CSV, TXT or TSV",
      active: audienceType === "upload",
      pick: () => {
        setAudienceType("upload");
        setAudienceName(uploadedContacts.length > 0 && uploadedFile ? `${uploadedFile.name} (${uploadedContacts.length} contacts)` : "CSV Upload Contact List");
        setRecipientCount(uploadedFile ? uploadedContacts.length : 0);
        setUploadError(null);
      },
    },
    {
      id: "paste" as const,
      icon: ClipboardList,
      title: "Paste numbers",
      body: "Type or paste a list",
      active: audienceType === "paste",
      pick: () => {
        setAudienceType("paste");
        setAudienceName(pastedStats.valid > 0 ? `Pasted Contact List (${pastedStats.valid} contacts)` : "Pasted Contact List");
        setRecipientCount(pastedStats.valid);
        setUploadError(null);
      },
    },
    {
      id: "existing" as const,
      icon: Database,
      title: "Saved contacts",
      body: "Everyone already in your workspace",
      active: usesSaved,
      pick: () => {
        setAudienceType("existing");
        setAudienceName("Saved contacts");
        setRecipientCount(0);
        setUploadError(null);
      },
    },
  ];

  const slide = reduce ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.22 } };

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6 pb-8">
        <PageHeader
          title="New campaign"
          subtitle="Write your message, choose who gets it, set where the link goes, then send."
          actions={
            isRetargeting ? (
              <Badge variant="purple" className="gap-1 !px-3 !py-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Follow-up
              </Badge>
            ) : undefined
          }
        />

        {/* stepper */}
        <ol className="flex items-center" aria-label="Progress">
          {STEPS.map((s, i) => {
            const done = step > s.num;
            const current = step === s.num;
            return (
              <li key={s.num} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
                <button
                  type="button"
                  onClick={() => goTo(s.num)}
                  disabled={!done}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-xl px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                    done && "cursor-pointer"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-all",
                      current && "bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/30",
                      done && "bg-emerald-500 text-white",
                      !current && !done && "bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500"
                    )}
                  >
                    {done ? <Check className="h-4 w-4" aria-hidden="true" /> : s.num}
                  </span>
                  <span
                    className={cn(
                      "hidden text-sm font-semibold sm:block",
                      current ? "text-slate-900 dark:text-white" : done ? "text-slate-700 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"
                    )}
                  >
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <span className="relative mx-3 h-0.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10" aria-hidden="true">
                    <span className={cn("absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-all duration-500", done ? "w-full" : "w-0")} />
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <AnimatePresence mode="wait" initial={false}>
          {/* ------------------------------------------------ step 1 */}
          {step === 1 && (
            <motion.div key="s1" {...slide} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
              <Panel title="Write your message" description="This is the SMS every recipient receives">
                <div className="space-y-5">
                  <TextField label="Campaign name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Eid weekend offer" hint="Only you see this. It helps you find the campaign later." />

                  <div>
                    <label htmlFor="sender" className={labelCls}>
                      Sender ID
                    </label>
                    <select id="sender" value={senderId} onChange={(e) => setSenderId(e.target.value)} className={cn(fieldCls, "h-12 px-4")}>
                      <option value="8809612781020">8809612781020</option>
                    </select>
                  </div>

                  <div>
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                      <label htmlFor="message" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Message
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleInsertMergeTag("{TRACKABLE_LINK}")}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-indigo-50 px-2.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25"
                        >
                          <Link2 className="h-3.5 w-3.5" aria-hidden="true" /> Add link
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertMergeTag("{name}")}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-slate-100 px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                        >
                          <Users className="h-3.5 w-3.5" aria-hidden="true" /> Add name
                        </button>
                      </div>
                    </div>
                    <textarea
                      id="message"
                      ref={messageTextareaRef}
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className={cn(fieldCls, "p-4 leading-relaxed")}
                      placeholder="Write your message and use Add link to place the tracking link"
                    />
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="tabular-nums">
                        {smsStats.characters} characters · {smsStats.segments} SMS · {smsStats.isUnicode ? "Unicode" : "Standard"}
                      </span>
                      {hasLinkTag ? (
                        <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Link included
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" /> Add the link to continue
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <FooterBar>
                  <span />
                  <button type="button" onClick={() => setStep(2)} disabled={!canNext1} className={btnPrimary}>
                    Choose audience <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </FooterBar>
              </Panel>

              <div className="hidden lg:block">
                <div className="sticky top-24">
                  <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">What they will see</p>
                  <SmsPreview sender={senderId} text={sampleMessage} />
                </div>
              </div>
            </motion.div>
          )}

          {/* ------------------------------------------------ step 2 */}
          {step === 2 && (
            <motion.div key="s2" {...slide}>
              <Panel title="Who should get it?" description="Pick where the phone numbers come from">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {audienceCards.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={c.pick}
                      aria-pressed={c.active}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                        c.active
                          ? "border-indigo-500 bg-indigo-50/60 ring-4 ring-indigo-500/10 dark:bg-indigo-500/10"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-slate-900 dark:hover:border-white/20"
                      )}
                    >
                      <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", c.active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300")}>
                        <c.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      </span>
                      <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{c.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{c.body}</p>
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  {/* upload */}
                  {audienceType === "upload" && (
                    <div className="space-y-3">
                      <input ref={fileInputRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={handleFileUpload} />
                      {uploadedContacts.length === 0 || !uploadedFile ? (
                        <div
                          role="button"
                          tabIndex={0}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                          }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
                          className={cn(
                            "cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                            isDragging ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/[0.03]"
                          )}
                        >
                          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                            <UploadCloud className="h-6 w-6" aria-hidden="true" />
                          </span>
                          <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Drop your file here, or click to browse</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            One phone number per row. Optional columns: <code className="font-mono">name</code>, <code className="font-mono">custom_id</code>
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadSampleCsv();
                            }}
                            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
                          >
                            <Download className="h-3.5 w-3.5" aria-hidden="true" /> Download a sample file
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                                <FileText className="h-5 w-5" aria-hidden="true" />
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{uploadedFile?.name}</p>
                                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{formatNumber(uploadedContacts.length)} valid contacts loaded</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => fileInputRef.current?.click()} className={cn(btnSecondary, "!h-9 !px-3 !text-xs")}>
                                Replace
                              </button>
                              <button type="button" onClick={handleRemoveFile} aria-label="Remove file" className={cn(btnSecondary, "!h-9 !w-9 !px-0 text-rose-600")}>
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* paste */}
                  {audienceType === "paste" && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label htmlFor="paste" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          Phone numbers
                        </label>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button type="button" onClick={handlePasteFromClipboard} className={cn(btnSecondary, "!h-8 !px-2.5 !text-xs")}>
                            {copiedNotification ? <CheckCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                            {copiedNotification ? "Pasted" : "Paste from clipboard"}
                          </button>
                          <button type="button" onClick={handleLoadSampleNumbers} className={cn(btnSecondary, "!h-8 !px-2.5 !text-xs")}>
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" /> Example
                          </button>
                          {pastedText && (
                            <button type="button" onClick={handleClearPasted} className={cn(btnSecondary, "!h-8 !px-2.5 !text-xs text-rose-600")}>
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Clear
                            </button>
                          )}
                        </div>
                      </div>
                      <textarea
                        id="paste"
                        rows={6}
                        value={pastedText}
                        onChange={(e) => handlePasteParse(e.target.value)}
                        placeholder={`01711234567\n8801812345678, Rahim Ahmed\n+8801912345679, Farhana Islam`}
                        className={cn(fieldCls, "p-4 font-mono leading-relaxed")}
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">One number per line, or separated by commas. You can add a name after the number. 017… is converted to 88017… for you.</p>
                      {pastedStats.total > 0 && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-slate-50 px-4 py-2.5 text-xs font-medium dark:bg-white/[0.04]">
                          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> {formatNumber(pastedStats.valid)} valid
                          </span>
                          {pastedStats.duplicates > 0 && <span className="text-amber-700 dark:text-amber-400">{formatNumber(pastedStats.duplicates)} duplicates removed</span>}
                          {pastedStats.invalid > 0 && <span className="text-rose-700 dark:text-rose-400">{formatNumber(pastedStats.invalid)} invalid</span>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* saved contacts */}
                  {usesSaved && (
                    <div className="flex items-start gap-3 rounded-xl bg-indigo-50 p-4 text-sm dark:bg-indigo-500/10">
                      <Database className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
                      <p className="text-indigo-900 dark:text-indigo-200">
                        The message goes to every active contact already saved in your workspace (up to 5,000). Contacts appear here after your first upload or paste.
                      </p>
                    </div>
                  )}

                  {uploadError && (
                    <div className="mt-3">
                      <Notice type="error">{uploadError}</Notice>
                    </div>
                  )}

                  {/* preview table */}
                  {!usesSaved && uploadedContacts.length > 0 && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                      <p className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">
                        Preview: first {Math.min(5, uploadedContacts.length)} of {formatNumber(uploadedContacts.length)}
                      </p>
                      <div className={tbl.wrap}>
                        <table className={tbl.table}>
                          <thead className={tbl.head}>
                            <tr>
                              <th className={tbl.th}>Phone</th>
                              <th className={tbl.th}>Name</th>
                              <th className={`${tbl.th} hidden sm:table-cell`}>Custom ID</th>
                            </tr>
                          </thead>
                          <tbody className={tbl.body}>
                            {uploadedContacts.slice(0, 5).map((c, i) => (
                              <tr key={i} className={tbl.row}>
                                <td className={`${tbl.td} ${tbl.mono} font-semibold`}>{c.phone}</td>
                                <td className={tbl.td}>{c.name || "—"}</td>
                                <td className={`${tbl.td} hidden text-slate-500 sm:table-cell`}>{c.customId || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm dark:bg-white/[0.04]">
                  <span className="text-slate-500 dark:text-slate-400">Sending to</span>
                  <strong className="font-semibold tabular-nums text-slate-900 dark:text-white">{audienceLabel}</strong>
                </div>

                <FooterBar>
                  <BackBtn to={1} />
                  <button type="button" onClick={() => setStep(3)} disabled={!canNext2} className={btnPrimary}>
                    Set the link <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </FooterBar>
              </Panel>
            </motion.div>
          )}

          {/* ------------------------------------------------ step 3 */}
          {step === 3 && (
            <motion.div key="s3" {...slide}>
              <Panel title="Where should the link go?" description="Each recipient gets their own short link that opens this page">
                <div className="space-y-6">
                  <TextField
                    label="Destination page"
                    type="url"
                    inputMode="url"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://yourwebsite.com/offer"
                    error={destinationUrl && !canNext3 ? "Enter a full link that starts with https://" : undefined}
                    hint={canNext3 ? "People are sent here when they tap the SMS link." : undefined}
                  />

                  <div>
                    <p className={labelCls}>Link style</p>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      {(
                        [
                          { id: "hyphen", title: "Prefix and code", path: `/${activePrefix || "eid"}-${sampleTrackingId}`, tag: "Recommended" },
                          { id: "slash", title: "Folder style", path: `/${activePrefix || "eid"}/${sampleTrackingId}` },
                          { id: "direct", title: "Code only", path: `/${sampleTrackingId}`, tag: "Shortest" },
                        ] as const
                      ).map((o) => {
                        const active = linkStyle === o.id;
                        return (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => setLinkStyle(o.id)}
                            aria-pressed={active}
                            className={cn(
                              "rounded-xl border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                              active
                                ? "border-indigo-500 bg-indigo-50/60 ring-4 ring-indigo-500/10 dark:bg-indigo-500/10"
                                : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-slate-900 dark:hover:border-white/20"
                            )}
                          >
                            <span className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                              {o.title}
                              {"tag" in o && o.tag && (
                                <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{o.tag}</span>
                              )}
                            </span>
                            <span className="mt-1 block truncate font-mono text-xs text-indigo-600 dark:text-indigo-300">{o.path}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {linkStyle !== "direct" && (
                    <div>
                      <label htmlFor="prefix" className={labelCls}>
                        Link word
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 font-mono text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                          {origin.replace(/^https?:\/\//, "")}/
                        </span>
                        <input
                          id="prefix"
                          type="text"
                          value={urlPrefix}
                          onChange={(e) => setUrlPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                          placeholder="eid"
                          className={cn(fieldCls, "h-12 rounded-l-none px-4 font-mono font-semibold")}
                        />
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {["eid", "offer", "deal", "promo", "vip", "sale", "t"].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setUrlPrefix(preset)}
                            className={cn(
                              "rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors",
                              activePrefix === preset
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-white/5"
                            )}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <details className="group rounded-xl border border-slate-200 dark:border-white/10">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Code format and length
                      <span className="text-xs font-medium text-slate-400">
                        {trackingFormat === "alphanumeric" ? "Letters and digits" : "Digits only"}, {trackingLength} characters
                      </span>
                    </summary>
                    <div className="grid gap-5 border-t border-slate-200 p-4 dark:border-white/10 sm:grid-cols-2">
                      <div>
                        <p className={labelCls}>Format</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(
                            [
                              { id: "alphanumeric", label: "Letters + digits" },
                              { id: "numeric", label: "Digits only" },
                            ] as const
                          ).map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setTrackingFormat(f.id)}
                              aria-pressed={trackingFormat === f.id}
                              className={cn(
                                "h-10 rounded-lg border text-xs font-semibold transition-colors",
                                trackingFormat === f.id
                                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                                  : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                              )}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className={labelCls}>Code length</p>
                        <div className="flex gap-1.5">
                          {[3, 4, 5, 6, 7, 8].map((len) => (
                            <button
                              key={len}
                              type="button"
                              onClick={() => setTrackingLength(len)}
                              aria-pressed={trackingLength === len}
                              className={cn(
                                "h-10 flex-1 rounded-lg border text-xs font-semibold transition-colors",
                                trackingLength === len
                                  ? "border-indigo-600 bg-indigo-600 text-white"
                                  : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                              )}
                            >
                              {len}
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Shorter codes keep the SMS short. 6 is a good balance.</p>
                      </div>
                    </div>
                  </details>

                  <div className="flex items-center gap-3 overflow-hidden rounded-xl bg-slate-900 px-4 py-3.5 text-white">
                    <Link2 className="h-4 w-4 shrink-0 text-indigo-300" aria-hidden="true" />
                    <span className="shrink-0 text-xs text-slate-400">Example</span>
                    <span className="truncate font-mono text-sm font-semibold text-indigo-200">{sampleTrackingUrl}</span>
                  </div>
                </div>

                <FooterBar>
                  <BackBtn to={2} />
                  <button type="button" onClick={() => setStep(4)} disabled={!canNext3} className={btnPrimary}>
                    Review <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </FooterBar>
              </Panel>
            </motion.div>
          )}

          {/* ------------------------------------------------ step 4 */}
          {step === 4 && (
            <motion.div key="s4" {...slide} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
              <Panel title="Ready to send?" description="Check everything one last time">
                <dl className="divide-y divide-slate-100 text-sm dark:divide-white/10">
                  {[
                    ["Campaign", name],
                    ["Sender ID", senderId],
                    ["Audience", audienceLabel],
                    ["Message length", `${smsStats.characters} characters, ${smsStats.segments} SMS`],
                    ["Sent through", "ZendSMS"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-4 py-3 first:pt-0">
                      <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                      <dd className="text-right font-semibold text-slate-900 dark:text-white">{v}</dd>
                    </div>
                  ))}
                  <div className="py-3">
                    <dt className="text-slate-500 dark:text-slate-400">Link opens</dt>
                    <dd className="mt-1 break-all font-mono text-[13px] font-medium text-indigo-600 dark:text-indigo-300">{destinationUrl}</dd>
                  </div>
                </dl>

                {launchError && (
                  <div className="mt-2">
                    <Notice type="error" onClose={() => setLaunchError(null)}>
                      {launchError}
                    </Notice>
                  </div>
                )}

                <FooterBar>
                  <BackBtn to={3} />
                  <button type="button" onClick={handleLaunchCampaign} disabled={isSubmitting} className={btnPrimary}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                    {isSubmitting ? "Creating links…" : "Create links and send"}
                  </button>
                </FooterBar>
              </Panel>

              <div>
                <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">What they will see</p>
                <SmsPreview sender={senderId} text={sampleMessage} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
