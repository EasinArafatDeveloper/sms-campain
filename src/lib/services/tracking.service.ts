import crypto from "crypto";
import { connectToDatabase } from "@/lib/db/connect";
import { TrackingLinkModel, ClickEventModel, CampaignRecipientModel, CampaignModel, EngagementProfileModel } from "@/lib/db/models";
import { EngagementService } from "./engagement.service";
import { TrackingFormat } from "@/types";
import { escapeRegex, sanitizeUrl } from "../security";

export class TrackingService {
  /**
   * Generates a cryptographically random unique tracking ID of specified format and length.
   */
  static generateShortId(format: TrackingFormat = "numeric", length = 6): string {
    if (format === "numeric") {
      const min = Math.pow(10, length - 1);
      const max = Math.pow(10, length) - 1;
      const randomBytes = crypto.randomBytes(4);
      const randomValue = randomBytes.readUInt32BE(0);
      const id = min + (randomValue % (max - min + 1));
      return id.toString();
    } else {
      const chars = "23456789abcdefghjkmnpqrstuvwxyz"; // Clean lowercase alphanumeric (removed ambiguous 0,1,l,o,i)
      const bytes = crypto.randomBytes(length);
      let result = "";
      for (let i = 0; i < length; i++) {
        result += chars[bytes[i] % chars.length];
      }
      return result;
    }
  }

  /**
   * Generates a batch of collision-free tracking IDs.
   */
  static async generateBatchIds(
    count: number,
    format: TrackingFormat = "numeric",
    length = 6
  ): Promise<string[]> {
    await connectToDatabase();
    const generated = new Set<string>();
    const needed = count;

    let attempts = 0;
    const maxAttempts = count * 5;

    while (generated.size < needed && attempts < maxAttempts) {
      attempts++;
      const id = this.generateShortId(format, length);
      if (!generated.has(id)) {
        generated.add(id);
      }
    }

    const ids = Array.from(generated);
    // Check against existing database tracking IDs
    const existing = await TrackingLinkModel.find({ trackingId: { $in: ids } }).select("trackingId").lean();
    const existingSet = new Set(existing.map((e) => e.trackingId));

    const finalIds: string[] = [];
    for (const id of ids) {
      if (!existingSet.has(id)) {
        finalIds.push(id);
        if (finalIds.length === count) break;
      }
    }

    // If collisions were found in database, fill remainder individually with retry
    while (finalIds.length < count) {
      let unique = false;
      while (!unique) {
        const freshId = this.generateShortId(format, length);
        if (!finalIds.includes(freshId)) {
          const exists = await TrackingLinkModel.exists({ trackingId: freshId });
          if (!exists) {
            finalIds.push(freshId);
            unique = true;
          }
        }
      }
    }

    return finalIds;
  }

  /**
   * Deeply inspects User-Agent, headers, and prefetch flags to detect automated bots,
   * SMS preview crawlers (Google/Apple Messages, Truecaller, WhatsApp, etc.), and network scanners.
   */
  static detectBot(metadata?: {
    userAgent?: string;
    purpose?: string;
    secPurpose?: string;
    secFetchDest?: string;
    secFetchMode?: string;
    accept?: string;
    acceptLanguage?: string;
  }): { isBot: boolean; reason: string } {
    if (!metadata) return { isBot: false, reason: "none" };

    const purpose = (metadata.purpose || metadata.secPurpose || "").toLowerCase();
    if (purpose.includes("prefetch") || purpose.includes("preview")) {
      return { isBot: true, reason: `prefetch_header (${purpose})` };
    }

    if (metadata.secFetchDest === "empty" && metadata.secFetchMode === "no-cors") {
      return { isBot: true, reason: "background_headless_fetch" };
    }

    const ua = (metadata.userAgent || "").toLowerCase();
    if (!ua) {
      return { isBot: true, reason: "missing_user_agent" };
    }

    const botSignatures: Array<{ pattern: string; name: string }> = [
      { pattern: "truecaller", name: "Truecaller SMS Scanner" },
      { pattern: "dalvik", name: "Dalvik Android Daemon" },
      { pattern: "android-sms", name: "Android SMS Link Preview" },
      { pattern: "samsungservice", name: "Samsung Anti-Spam Scanner" },
      { pattern: "okhttp", name: "OkHttp Automated Client" },
      { pattern: "apache-httpclient", name: "Apache HttpClient" },
      { pattern: "cfnetwork", name: "Apple CFNetwork Daemon" },
      { pattern: "google-page-preview", name: "Google Page Preview" },
      { pattern: "google-read-aloud", name: "Google Read Aloud" },
      { pattern: "googlebot", name: "Googlebot" },
      { pattern: "applebot", name: "Applebot / iMessage Preview" },
      { pattern: "facebookexternalhit", name: "Facebook / Meta Preview Bot" },
      { pattern: "facebot", name: "Facebot" },
      { pattern: "whatsapp", name: "WhatsApp Link Preview" },
      { pattern: "telegrambot", name: "Telegram Bot" },
      { pattern: "twitterbot", name: "Twitterbot" },
      { pattern: "slackbot", name: "Slackbot" },
      { pattern: "skypeuripreview", name: "Skype URI Preview" },
      { pattern: "viber", name: "Viber Link Preview" },
      { pattern: "discordbot", name: "Discordbot" },
      { pattern: "bingbot", name: "Bingbot" },
      { pattern: "duckduckbot", name: "DuckDuckBot" },
      { pattern: "yandex", name: "Yandex Bot" },
      { pattern: "bytespider", name: "ByteSpider" },
      { pattern: "petalbot", name: "PetalBot" },
      { pattern: "x11; linux x86_64", name: "Cloud Headless Crawler (Linux)" },
      { pattern: "headlesschrome", name: "Headless Chrome" },
      { pattern: "headless", name: "Headless Browser Scanner" },
      { pattern: "phantomjs", name: "PhantomJS" },
      { pattern: "lighthouse", name: "Lighthouse Audit" },
      { pattern: "curl", name: "cURL" },
      { pattern: "python", name: "Python Requests/Scraper" },
      { pattern: "go-http-client", name: "Go HTTP Client" },
      { pattern: "node-fetch", name: "Node Fetch" },
      { pattern: "postman", name: "Postman" },
      { pattern: "wget", name: "Wget" },
      { pattern: "winhttp", name: "WinHTTP" },
      { pattern: "scrapy", name: "Scrapy Crawler" },
      { pattern: "axios", name: "Axios Script" },
      { pattern: "semrush", name: "Semrush Bot" },
      { pattern: "ahrefs", name: "Ahrefs Bot" },
    ];

    for (const sig of botSignatures) {
      if (ua.includes(sig.pattern)) {
        return { isBot: true, reason: sig.name };
      }
    }

    // Check for general bot/spider keywords in user agent
    if (ua.includes("bot") || ua.includes("spider") || ua.includes("crawler") || ua.includes("preview") || ua.includes("scanner")) {
      return { isBot: true, reason: "generic_crawler_keyword" };
    }

    return { isBot: false, reason: "real_browser" };
  }

  /**
   * Generates ultra-fast client-side HTML trampoline page for human touchpoint verification.
   * Fully sanitizes URLs and prevents stored XSS when embedding variables in HTML/JS.
   */
  static generateTrampolineHtml(destinationUrl: string, trackingId: string, verifyToken: string): string {
    const validUrl = sanitizeUrl(destinationUrl) || "https://postman.asia";
    // Sanitize for HTML attribute
    const safeHtmlDest = validUrl
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Sanitize JSON embeddings against script tag breakout
    const safeDestJson = JSON.stringify(validUrl).replace(/</g, "\\u003c");
    const safeTokenJson = JSON.stringify(verifyToken).replace(/</g, "\\u003c");
    const safeTrackingIdJson = JSON.stringify(trackingId).replace(/</g, "\\u003c");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="1;url=${safeHtmlDest}">
  <title>Opening Link...</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      overflow: hidden;
    }
    .box {
      text-align: center;
      padding: 24px;
      max-width: 320px;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(59, 130, 246, 0.2);
      border-top-color: #3b82f6;
      border-radius: 50%;
      margin: 0 auto 16px;
      animation: spin 0.6s linear infinite;
    }
    .text {
      font-size: 13px;
      font-weight: 500;
      color: #94a3b8;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="box">
    <div class="spinner"></div>
    <div class="text">Redirecting to destination...</div>
  </div>
  <script>
    (function() {
      var dest = ${safeDestJson};
      var token = ${safeTokenJson};
      var trk = ${safeTrackingIdJson};
      try {
        var payload = JSON.stringify({
          token: token,
          trackingId: trk,
          screenWidth: window.screen ? window.screen.width : 0,
          screenHeight: window.screen ? window.screen.height : 0,
          hasTouch: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),
          renderTimeMs: Math.round(performance.now())
        });
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/tracking/verify', new Blob([payload], { type: 'application/json' }));
        } else {
          fetch('/api/tracking/verify', {
            method: 'POST',
            body: payload,
            headers: { 'Content-Type': 'application/json' },
            keepalive: true
          });
        }
      } catch(e) {}
      window.location.replace(dest);
    })();
  </script>
</body>
</html>`;
  }

  /**
   * Resolves a tracking ID, classifies bot vs candidate human,
   * logs pending telemetry asynchronously, and returns destination URL / trampoline HTML.
   */
  static async resolveAndTrackClick(
    trackingId: string,
    metadata?: {
      ip?: string;
      userAgent?: string;
      referer?: string;
      purpose?: string;
      secPurpose?: string;
      secFetchDest?: string;
      secFetchMode?: string;
      accept?: string;
      acceptLanguage?: string;
    }
  ): Promise<{
    destinationUrl: string | null;
    campaignId?: string;
    recipientId?: string;
    isBot: boolean;
    botReason?: string;
    trampolineHtml?: string;
    verifyToken?: string;
  }> {
    await connectToDatabase();

    const cleanId = (trackingId || "").trim();
    const subId = cleanId.includes("-") ? cleanId.split("-").slice(1).join("-") : cleanId;

    const safeCleanId = escapeRegex(cleanId);
    const safeSubId = escapeRegex(subId);

    const link = await TrackingLinkModel.findOne({
      $or: [
        { trackingId: cleanId },
        { trackingId: cleanId.toLowerCase() },
        { trackingId: subId },
        { trackingId: subId.toLowerCase() },
        { trackingId: { $regex: `^${safeCleanId}$`, $options: "i" } },
        { trackingId: { $regex: `^${safeSubId}$`, $options: "i" } },
        { uniqueUrl: { $regex: `/${safeCleanId}$`, $options: "i" } },
      ],
      status: "active",
    });
    if (!link) {
      return { destinationUrl: null, isBot: false };
    }

    const now = new Date();
    const campId = link.campaignId.toString();
    const recipId = link.recipientId.toString();

    // 1. Deep Bot & Prefetch Inspection
    const botCheck = this.detectBot(metadata);
    const isBot = botCheck.isBot;
    const botReason = botCheck.reason;

    // Generate cryptographic verification token for candidate human click
    const verifyToken = crypto.randomBytes(16).toString("hex");

    // Fire background logging without blocking redirect
    (async () => {
      try {
        const ipHash = metadata?.ip
          ? crypto.createHash("sha256").update(metadata.ip).digest("hex").substring(0, 16)
          : undefined;

        if (isBot) {
          // Log Bot Scan Event separately
          await ClickEventModel.create({
            organizationId: link.organizationId,
            campaignId: link.campaignId,
            recipientId: link.recipientId,
            trackingId,
            destinationUrl: link.destinationUrl,
            clickedAt: now,
            ipHash,
            userAgent: metadata?.userAgent,
            referer: metadata?.referer,
            isBot: true,
            botReason,
            isHumanVerified: false,
            metadata: { detectedBot: botReason },
          });

          // Increment Bot count only (Keeping real human stats 100% clean)
          await Promise.all([
            TrackingLinkModel.updateOne({ _id: link._id }, { $inc: { botClickCount: 1 } }),
            CampaignModel.updateOne({ _id: link.campaignId }, { $inc: { "statistics.botClicksCount": 1 } }),
          ]);
          return;
        }

        // Candidate human browser: Log as pending verification (DO NOT increment human metrics until JS beacon executes)
        await ClickEventModel.create({
          organizationId: link.organizationId,
          campaignId: link.campaignId,
          recipientId: link.recipientId,
          trackingId,
          destinationUrl: link.destinationUrl,
          clickedAt: now,
          ipHash,
          userAgent: metadata?.userAgent,
          referer: metadata?.referer,
          isBot: false,
          botReason: "pending_human_verification",
          isHumanVerified: false,
          metadata: { verifyToken },
        });
      } catch (err) {
        console.error("[TrackingService] Error logging candidate click:", err);
      }
    })();

    const trampolineHtml = !isBot
      ? this.generateTrampolineHtml(link.destinationUrl, trackingId, verifyToken)
      : undefined;

    return {
      destinationUrl: link.destinationUrl,
      campaignId: campId,
      recipientId: recipId,
      isBot,
      botReason,
      trampolineHtml,
      verifyToken,
    };
  }

  /**
   * Finalizes a verified human click after client-side JavaScript beacon execution.
   */
  static async recordVerifiedHumanClick(
    token: string,
    trackingId?: string,
    clientMeta?: {
      screenWidth?: number;
      screenHeight?: number;
      hasTouch?: boolean;
      renderTimeMs?: number;
    }
  ): Promise<{ success: boolean; verified: boolean }> {
    await connectToDatabase();

    // Verification token is required to prevent unauthorized click forging
    if (!token || typeof token !== "string") {
      return { success: false, verified: false };
    }

    const query: any = { "metadata.verifyToken": token };
    if (trackingId) {
      query.trackingId = trackingId;
    }

    // Find the most recent pending candidate click event
    const event = await ClickEventModel.findOne(query).sort({ clickedAt: -1 });
    if (!event) {
      return { success: false, verified: false };
    }

    // If already verified, do not duplicate count
    if (event.isHumanVerified) {
      return { success: true, verified: true };
    }

    const now = new Date();

    // 1. Mark event as fully human verified with telemetry
    event.isHumanVerified = true;
    event.isBot = false;
    event.botReason = "real_browser";
    event.clientMeta = {
      screenWidth: Number(clientMeta?.screenWidth) || 0,
      screenHeight: Number(clientMeta?.screenHeight) || 0,
      hasTouch: Boolean(clientMeta?.hasTouch),
      renderTimeMs: Number(clientMeta?.renderTimeMs) || 0,
      verifiedAt: now,
    };
    await event.save();

    // 2. Fetch the tracking link
    const cleanId = event.trackingId;
    const subId = cleanId.includes("-") ? cleanId.split("-").slice(1).join("-") : cleanId;

    const safeCleanId = escapeRegex(cleanId);
    const safeSubId = escapeRegex(subId);

    const link = await TrackingLinkModel.findOne({
      $or: [
        { trackingId: cleanId },
        { trackingId: cleanId.toLowerCase() },
        { trackingId: subId },
        { trackingId: subId.toLowerCase() },
        { trackingId: { $regex: `^${safeCleanId}$`, $options: "i" } },
        { trackingId: { $regex: `^${safeSubId}$`, $options: "i" } },
        { uniqueUrl: { $regex: `/${safeCleanId}$`, $options: "i" } },
      ],
    });

    if (!link) {
      return { success: true, verified: true };
    }

    // Debounce: Avoid double-counting if verified click happened < 2s ago
    const isRapidDuplicate =
      link.lastClickedAt && now.getTime() - new Date(link.lastClickedAt).getTime() < 2000;
    if (isRapidDuplicate) {
      return { success: true, verified: true };
    }

    const isFirstClick = !link.firstClickedAt;
    const orgId = link.organizationId.toString();
    const campId = link.campaignId.toString();
    const recipId = link.recipientId.toString();

    // 3. Update TrackingLink click count & times
    await TrackingLinkModel.updateOne(
      { _id: link._id },
      {
        $inc: { clickCount: 1 },
        $set: {
          lastClickedAt: now,
          ...(isFirstClick ? { firstClickedAt: now } : {}),
        },
      }
    );

    // 4. Update CampaignRecipient status
    await CampaignRecipientModel.updateOne(
      {
        organizationId: link.organizationId,
        campaignId: link.campaignId,
        recipientId: link.recipientId,
      },
      {
        $set: {
          clickStatus: "clicked",
          lastClickedAt: now,
          ...(isFirstClick ? { firstClickedAt: now } : {}),
        },
        $inc: { clickCount: 1 },
      }
    );

    // 5. Update Campaign statistics
    const incQuery: any = {
      "statistics.totalClicks": 1,
    };
    if (isFirstClick) {
      incQuery["statistics.uniqueClickers"] = 1;
    }

    await CampaignModel.updateOne({ _id: link.campaignId }, { $inc: incQuery });

    // 6. Update Recipient Engagement Profile & Lead Status
    await EngagementService.recordRecipientClick(orgId, recipId, campId, now);

    return { success: true, verified: true };
  }
}
