import crypto from "crypto";
import { connectToDatabase } from "@/lib/db/connect";
import { TrackingLinkModel, ClickEventModel, CampaignRecipientModel, CampaignModel, EngagementProfileModel } from "@/lib/db/models";
import { EngagementService } from "./engagement.service";
import { TrackingFormat } from "@/types";

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
      const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Removed ambiguous 0,1,I,O
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
   * Detects automated link preview crawlers, bots, or browser prefetch requests.
   */
  static isBotOrPreview(userAgent?: string, purpose?: string): boolean {
    if (purpose && (purpose.includes("prefetch") || purpose.includes("preview"))) {
      return true;
    }
    if (!userAgent) return false;
    const ua = userAgent.toLowerCase();
    const botKeywords = [
      "bot",
      "spider",
      "crawler",
      "preview",
      "google-page-preview",
      "google-read-aloud",
      "googlebot",
      "facebookexternalhit",
      "whatsapp",
      "telegrambot",
      "twitterbot",
      "slackbot",
      "applebot",
      "discordbot",
      "bingbot",
      "duckduckbot",
      "yandexbot",
      "skypeuripreview",
      "viber",
      "lighthouse",
      "headlesschrome",
    ];
    return botKeywords.some((keyword) => ua.includes(keyword));
  }

  /**
   * Resolves a tracking ID, logs click telemetry asynchronously, and returns destination URL.
   */
  static async resolveAndTrackClick(
    trackingId: string,
    metadata?: {
      ip?: string;
      userAgent?: string;
      referer?: string;
      purpose?: string;
    }
  ): Promise<{ destinationUrl: string | null; campaignId?: string; recipientId?: string }> {
    await connectToDatabase();

    const link = await TrackingLinkModel.findOne({ trackingId, status: "active" });
    if (!link) {
      return { destinationUrl: null };
    }

    const now = new Date();

    // Async Non-blocking click telemetry updates
    const orgId = link.organizationId.toString();
    const campId = link.campaignId.toString();
    const recipId = link.recipientId.toString();

    // 1. Check for link preview bots / prefetches
    const isBot = this.isBotOrPreview(metadata?.userAgent, metadata?.purpose);

    // 2. Debounce: If link was clicked less than 2.5 seconds ago (e.g. mobile browser touch follow-ups), skip double increment
    const isRapidDuplicate =
      link.lastClickedAt && now.getTime() - new Date(link.lastClickedAt).getTime() < 2500;

    if (isBot || isRapidDuplicate) {
      return {
        destinationUrl: link.destinationUrl,
        campaignId: campId,
        recipientId: recipId,
      };
    }

    // Fire background updates without blocking redirect
    (async () => {
      try {
        // 1. Create Click Event
        await ClickEventModel.create({
          organizationId: link.organizationId,
          campaignId: link.campaignId,
          recipientId: link.recipientId,
          trackingId,
          destinationUrl: link.destinationUrl,
          clickedAt: now,
          ipHash: metadata?.ip ? crypto.createHash("sha256").update(metadata.ip).digest("hex").substring(0, 16) : undefined,
          userAgent: metadata?.userAgent,
          referer: metadata?.referer,
        });

        // 2. Update TrackingLink click count & times
        const isFirstClick = !link.firstClickedAt;
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

        // 3. Update CampaignRecipient status
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

        // 4. Update Campaign statistics
        const incQuery: any = {
          "statistics.totalClicks": 1,
        };
        if (isFirstClick) {
          incQuery["statistics.uniqueClickers"] = 1;
        }

        await CampaignModel.updateOne({ _id: link.campaignId }, { $inc: incQuery });

        // 5. Update Recipient Engagement Profile & Lead Status
        await EngagementService.recordRecipientClick(orgId, recipId, campId, now);
      } catch (err) {
        console.error("[TrackingService] Error recording click telemetry:", err);
      }
    })();

    return {
      destinationUrl: link.destinationUrl,
      campaignId: campId,
      recipientId: recipId,
    };
  }
}
