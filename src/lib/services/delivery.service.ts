import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import {
  DeliveryJobModel,
  CampaignRecipientModel,
  CampaignModel,
  DeliveryEventModel,
  AuditLogModel,
  OrganizationModel,
  ApiCredentialModel,
} from "@/lib/db/models";
import { getSmsProviderForOrg } from "../providers";
import { DeliveryStatus, PaginatedResult } from "@/types";
import { escapeRegex } from "../security";
import { BRAND } from "../brand";

export interface DeliveryQueueStats {
  totalQueued: number;
  processing: number;
  sent: number;
  delivered: number;
  failed: number;
  pendingRetry: number;
}

export interface ApiHealthMetrics {
  provider: string;
  status: "operational" | "degraded" | "down";
  averageResponseMs: number;
  successRate: number;
  requestsPerMinute: number;
  retries: number;
  balance?: number;
  currency?: string;
}

export class DeliveryService {
  /**
   * Retrieves summary statistics for delivery queue KPI cards.
   */
  static async getQueueStats(organizationId: string, campaignId?: string): Promise<DeliveryQueueStats> {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const match: any = { organizationId: orgObjId };
    if (campaignId) {
      match.campaignId = new mongoose.Types.ObjectId(campaignId);
    }

    const counts = await DeliveryJobModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const stats: DeliveryQueueStats = {
      totalQueued: 0,
      processing: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      pendingRetry: 0,
    };

    counts.forEach((item) => {
      const s = item._id as DeliveryStatus;
      if (s === "queued") stats.totalQueued = item.count;
      else if (s === "processing") stats.processing = item.count;
      else if (s === "sent") stats.sent = item.count;
      else if (s === "delivered") stats.delivered = item.count;
      else if (s === "failed") stats.failed = item.count;
      else if (s === "retrying" || s === "pending_retry") stats.pendingRetry += item.count;
    });

    return stats;
  }

  /**
   * Retrieves paginated delivery queue items with full attribution.
   */
  static async listQueueJobs(
    organizationId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
      campaignId?: string;
    } = {}
  ): Promise<PaginatedResult<any>> {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 15));
    const skip = (page - 1) * limit;

    const query: any = { organizationId: orgObjId };

    if (options.status && options.status !== "all") {
      query.status = options.status;
    }

    if (options.campaignId) {
      query.campaignId = new mongoose.Types.ObjectId(options.campaignId);
    }

    if (options.search) {
      const safeSearch = escapeRegex(options.search);
      query.$or = [
        { phone: { $regex: safeSearch, $options: "i" } },
        { trackingId: { $regex: safeSearch, $options: "i" } },
        { providerMessageId: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const [jobs, total] = await Promise.all([
      DeliveryJobModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      DeliveryJobModel.countDocuments(query),
    ]);

    // Attach click status and trackingUrl from CampaignRecipient junction
    const trackingIds = jobs.map((j) => j.trackingId);
    const recipients = await CampaignRecipientModel.find({
      organizationId: orgObjId,
      trackingId: { $in: trackingIds },
    })
      .select("trackingId trackingUrl clickStatus clickCount firstClickedAt")
      .lean();

    const recipMap = new Map(recipients.map((r) => [r.trackingId, r]));

    const enrichedJobs = jobs.map((job) => {
      const r = recipMap.get(job.trackingId);
      return {
        ...job,
        trackingUrl: r?.trackingUrl,
        clickStatus: r?.clickStatus || "not_clicked",
        clickCount: r?.clickCount || 0,
      };
    });

    return {
      data: enrichedJobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getApiHealth(organizationId: string): Promise<ApiHealthMetrics> {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const [providerCred, org] = await Promise.all([
      ApiCredentialModel.findOne({ organizationId: orgObjId, isDefault: true, apiKey: { $exists: true, $ne: "" } }).lean(),
      OrganizationModel.findById(orgObjId).select("smsCredits").lean(),
    ]);

    const provider = await getSmsProviderForOrg(organizationId);
    const health = await provider.healthCheck();

    let balance: number | undefined = undefined;
    if (providerCred?.apiKey && providerCred.apiKey.trim().length > 0) {
      try {
        const balanceRes = await provider.getBalance();
        balance = balanceRes.balance;
      } catch (e) {
        console.warn("[getApiHealth] Failed to fetch BYOK balance:", e);
      }
    }

    const [pendingRetries, deliveredCount, failedCount, sentCount] = await Promise.all([
      DeliveryJobModel.countDocuments({
        organizationId: orgObjId,
        status: { $in: ["retrying", "pending_retry"] },
      }),
      DeliveryJobModel.countDocuments({ organizationId: orgObjId, status: "delivered" }),
      DeliveryJobModel.countDocuments({ organizationId: orgObjId, status: "failed" }),
      DeliveryJobModel.countDocuments({ organizationId: orgObjId, status: "sent" }),
    ]);

    const totalFinished = deliveredCount + sentCount + failedCount;
    const successRate =
      totalFinished > 0
        ? Number((((deliveredCount + sentCount) / totalFinished) * 100).toFixed(1))
        : 100;

    return {
      provider: providerCred?.apiKey ? "ZENDSMS (BYOK)" : `${BRAND.name.toUpperCase()} SHARED GATEWAY`,
      status: health.healthy ? "operational" : "degraded",
      averageResponseMs: health.responseTimeMs || 0,
      successRate,
      requestsPerMinute: 0,
      retries: pendingRetries,
      balance,
      currency: "BDT",
    };
  }

  /**
   * Processes a batch of queued SMS jobs atomically with wallet credit verification.
   */
  static async processBatch(
    organizationId: string,
    limit = 50,
    campaignId?: string
  ): Promise<{ processed: number; sent: number; failed: number; outOfCredits?: boolean }> {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const provider = await getSmsProviderForOrg(organizationId);

    const query: any = {
      organizationId: orgObjId,
      status: { $in: ["queued", "retrying", "pending_retry"] },
    };

    if (campaignId) {
      query.campaignId = new mongoose.Types.ObjectId(campaignId);
    }

    const candidateJobs = await DeliveryJobModel.find(query)
      .limit(limit)
      .sort({ createdAt: 1 })
      .select("_id");

    let sent = 0;
    let failed = 0;
    let outOfCredits = false;

    for (const candidate of candidateJobs) {
      // 1. Check & Atomically Deduct 1 Credit from Organization Wallet
      const orgCreditDeduction = await OrganizationModel.findOneAndUpdate(
        { _id: orgObjId, smsCredits: { $gt: 0 } },
        { $inc: { smsCredits: -1 } },
        { new: true }
      );

      if (!orgCreditDeduction) {
        // Out of SMS credits: do not dispatch further
        outOfCredits = true;
        break;
      }

      // 2. Atomically claim job (prevents dual-worker race conditions)
      const job = await DeliveryJobModel.findOneAndUpdate(
        {
          _id: candidate._id,
          status: { $in: ["queued", "retrying", "pending_retry"] },
        },
        {
          $set: { status: "processing", lastAttemptAt: new Date() },
          $inc: { attempts: 1 },
        },
        { new: true }
      );

      if (!job) {
        // Already claimed by another worker, refund credit
        await OrganizationModel.updateOne({ _id: orgObjId }, { $inc: { smsCredits: 1 } });
        continue;
      }

      const result = await provider.sendSms({
        to: job.phone,
        message: job.message,
        senderId: job.senderId,
      });

      if (result.success) {
        job.status = "sent";
        job.providerMessageId = result.providerMessageId;
        await job.save();
        sent++;

        // Update CampaignRecipient
        await CampaignRecipientModel.updateOne(
          {
            organizationId: orgObjId,
            campaignId: job.campaignId,
            recipientId: job.recipientId,
          },
          {
            $set: {
              deliveryStatus: "sent",
              providerMessageId: result.providerMessageId,
              sentAt: new Date(),
            },
          }
        );

        // Update campaign statistics
        await CampaignModel.updateOne(
          { _id: job.campaignId },
          {
            $inc: { "statistics.sent": 1, "statistics.queued": -1 },
          }
        );

        // Record Delivery Event
        await DeliveryEventModel.create({
          organizationId: orgObjId,
          campaignId: job.campaignId,
          recipientId: job.recipientId,
          trackingId: job.trackingId,
          provider: provider.name,
          providerMessageId: result.providerMessageId || "N/A",
          eventType: "sent",
          payload: result.rawResponse || {},
        });
      } else {
        // Refund credit on immediate failure
        await OrganizationModel.updateOne({ _id: orgObjId }, { $inc: { smsCredits: 1 } });

        if (job.attempts < job.maxAttempts) {
          job.status = "pending_retry";
          job.nextRetryAt = new Date(Date.now() + job.attempts * 60000);
          await job.save();
        } else {
          job.status = "failed";
          job.errorMessage = result.error;
          await job.save();
          failed++;

          await CampaignModel.updateOne(
            { _id: job.campaignId },
            {
              $inc: { "statistics.failed": 1, "statistics.queued": -1 },
            }
          );
        }
      }
    }

    return { processed: sent + failed, sent, failed, outOfCredits };
  }
}
