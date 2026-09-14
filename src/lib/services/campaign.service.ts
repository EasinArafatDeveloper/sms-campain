import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import {
  CampaignModel,
  RecipientModel,
  CampaignRecipientModel,
  TrackingLinkModel,
  DeliveryJobModel,
  ClickEventModel,
  AuditLogModel,
} from "@/lib/db/models";
import { TrackingService } from "./tracking.service";
import { normalizePhoneNumber } from "../utils";
import { ICampaign, PaginatedResult } from "@/types";

export interface CreateCampaignDTO {
  name: string;
  senderId: string;
  message: string;
  audienceType: "upload" | "existing" | "crm" | "segment" | "retargeting";
  audienceId?: string;
  audienceName?: string;
  destinationUrl: string;
  trackingFormat?: "numeric" | "alphanumeric";
  trackingLength?: number;
  urlPrefix?: string;
  linkStyle?: "hyphen" | "slash" | "direct";
  scheduledAt?: string;
  contacts?: { phone: string; name?: string; customId?: string }[];
}

export class CampaignService {
  /**
   * Creates a new campaign and processes recipients, tracking links, and queue jobs.
   */
  static async createCampaign(
    organizationId: string,
    userId: string,
    data: CreateCampaignDTO,
    options?: { baseUrl?: string }
  ): Promise<ICampaign> {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const userObjId = new mongoose.Types.ObjectId(userId);

    const format = data.trackingFormat || "alphanumeric";
    const length = data.trackingLength || 6;
    const linkStyle = data.linkStyle || "hyphen";
    const rawPrefix = (data.urlPrefix || "").trim().replace(/^\/+|\/+$/g, "").toLowerCase();
    const urlPrefix = rawPrefix || (linkStyle === "direct" ? "" : "eid");
    const destUrl = data.destinationUrl.trim();

    // 1. Create Campaign Document
    const campaign = await CampaignModel.create({
      organizationId: orgObjId,
      name: data.name.trim(),
      senderId: data.senderId.trim(),
      message: data.message,
      status: "queued",
      audienceId: data.audienceId ? new mongoose.Types.ObjectId(data.audienceId) : undefined,
      audienceName: data.audienceName || "Custom Audience",
      recipientCount: 0,
      trackingConfig: {
        destinationUrl: destUrl,
        format,
        length,
        urlPrefix,
        linkStyle,
      },
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      createdBy: userObjId,
      statistics: {
        totalRecipients: 0,
        linksGenerated: 0,
        queued: 0,
        processing: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        pendingRetry: 0,
        totalClicks: 0,
        uniqueClickers: 0,
        repeatClickers: 0,
        highIntentLeads: 0,
        deliveryRate: 0,
        clickRate: 0,
      },
    });

    // 2. Fetch or create recipients from direct input / CSV or audience
    let recipientsList: Array<{ recipientId: mongoose.Types.ObjectId; phone: string; name?: string }> = [];

    if (data.contacts && Array.isArray(data.contacts) && data.contacts.length > 0) {
      for (const contact of data.contacts) {
        const { normalized, isValid } = normalizePhoneNumber(contact.phone);
        if (isValid) {
          let recip = await RecipientModel.findOne({ organizationId: orgObjId, phone: normalized });
          if (!recip) {
            recip = await RecipientModel.create({
              organizationId: orgObjId,
              phone: normalized,
              name: contact.name || "",
              customId: contact.customId,
              status: "active",
            });
          }
          recipientsList.push({
            recipientId: recip._id as mongoose.Types.ObjectId,
            phone: normalized,
            name: contact.name || recip.name,
          });
        }
      }
    } else {
      // Fetch recipients from database (e.g. existing audience or first 5000 recipients)
      const existingRecipients = await RecipientModel.find({ organizationId: orgObjId, status: "active" })
        .limit(5000)
        .lean();

      recipientsList = existingRecipients.map((r) => ({
        recipientId: r._id as mongoose.Types.ObjectId,
        phone: r.phone,
        name: r.name,
      }));
    }

    const totalRecipients = recipientsList.length;
    campaign.recipientCount = totalRecipients;
    campaign.statistics.totalRecipients = totalRecipients;

    // 3. Generate unique tracking IDs and tracking links
    if (totalRecipients > 0) {
      const trackingIds = await TrackingService.generateBatchIds(totalRecipients, format, length);
      
      let resolvedBase = options?.baseUrl || process.env.TRACKING_BASE_URL;
      if (!resolvedBase) {
        if (process.env.NEXT_PUBLIC_APP_URL) {
          resolvedBase = `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")}`;
        } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
          resolvedBase = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
        } else if (process.env.VERCEL_URL) {
          resolvedBase = `https://${process.env.VERCEL_URL}`;
        } else {
          resolvedBase = "http://localhost:3000";
        }
      } else {
        // Strip trailing /t if preset so we cleanly append custom urlPrefix
        resolvedBase = resolvedBase.replace(/\/+t\/?$/, "").replace(/\/+$/, "");
      }
      const appBaseUrl = resolvedBase.replace(/\/+$/, "");

      const trackingLinksToInsert: any[] = [];
      const campaignRecipientsToInsert: any[] = [];
      const deliveryJobsToInsert: any[] = [];

      for (let i = 0; i < totalRecipients; i++) {
        const item = recipientsList[i];
        const rawCode = trackingIds[i];

        let pathSegment = rawCode;
        if (linkStyle === "hyphen" && urlPrefix) {
          pathSegment = `${urlPrefix}-${rawCode}`;
        } else if (linkStyle === "slash" && urlPrefix) {
          pathSegment = `${urlPrefix}/${rawCode}`;
        } else if (urlPrefix && linkStyle !== "direct") {
          pathSegment = `${urlPrefix}-${rawCode}`;
        }

        const trackingId = pathSegment;
        const uniqueUrl = `${appBaseUrl}/${pathSegment}`;

        const trackingLinkId = new mongoose.Types.ObjectId();

        trackingLinksToInsert.push({
          _id: trackingLinkId,
          organizationId: orgObjId,
          campaignId: campaign._id,
          recipientId: item.recipientId,
          trackingId,
          destinationUrl: destUrl,
          uniqueUrl,
          status: "active",
          clickCount: 0,
        });

        // Replace merge tag {TRACKABLE_LINK}
        const personalizedMessage = data.message.replace(/\{TRACKABLE_LINK\}/gi, uniqueUrl);

        campaignRecipientsToInsert.push({
          organizationId: orgObjId,
          campaignId: campaign._id,
          recipientId: item.recipientId,
          phone: item.phone,
          recipientName: item.name,
          trackingLinkId,
          trackingId,
          trackingUrl: uniqueUrl,
          personalizedMessage,
          deliveryStatus: "queued",
          clickStatus: "not_clicked",
          clickCount: 0,
        });

        deliveryJobsToInsert.push({
          organizationId: orgObjId,
          campaignId: campaign._id,
          recipientId: item.recipientId,
          trackingId,
          phone: item.phone,
          message: personalizedMessage,
          senderId: data.senderId,
          provider: "zendsms",
          status: "queued",
          attempts: 0,
          maxAttempts: 3,
        });
      }

      // Batch insert with chunking
      const chunkSize = 1000;
      for (let i = 0; i < trackingLinksToInsert.length; i += chunkSize) {
        await TrackingLinkModel.insertMany(trackingLinksToInsert.slice(i, i + chunkSize));
        await CampaignRecipientModel.insertMany(campaignRecipientsToInsert.slice(i, i + chunkSize));
        await DeliveryJobModel.insertMany(deliveryJobsToInsert.slice(i, i + chunkSize));
      }

      campaign.statistics.linksGenerated = totalRecipients;
      campaign.statistics.queued = totalRecipients;
      campaign.status = "queued";
    } else {
      campaign.status = "draft";
    }

    await campaign.save();

    // Audit log
    await AuditLogModel.create({
      organizationId: orgObjId,
      userId: userObjId,
      action: "CAMPAIGN_CREATED",
      resourceType: "campaign",
      resourceId: campaign._id.toString(),
      metadata: { name: campaign.name, recipientCount: totalRecipients },
    });

    return campaign.toObject() as unknown as ICampaign;
  }

  /**
   * Retrieves list of campaigns with search, filter, and pagination.
   */
  static async listCampaigns(
    organizationId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
    } = {}
  ): Promise<PaginatedResult<ICampaign>> {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    const query: any = { organizationId: orgObjId };

    if (options.status && options.status !== "all") {
      query.status = options.status;
    }

    if (options.search) {
      query.name = { $regex: options.search, $options: "i" };
    }

    const [data, total] = await Promise.all([
      CampaignModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      CampaignModel.countDocuments(query),
    ]);

    return {
      data: data as unknown as ICampaign[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single campaign details with live statistics.
   */
  static async getCampaignById(organizationId: string, campaignId: string): Promise<ICampaign | null> {
    await connectToDatabase();
    const camp = await CampaignModel.findOne({
      _id: new mongoose.Types.ObjectId(campaignId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).lean();

    return (camp as unknown as ICampaign) || null;
  }

  /**
   * Get comprehensive campaign details along with per-recipient delivery, tracking code,
   * and click attribution history with search, filtering, and pagination.
   */
  static async getCampaignDetailedReport(
    organizationId: string,
    campaignId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      filter?: "all" | "clicked" | "high_intent" | "delivered" | "failed";
    } = {}
  ) {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const campObjId = new mongoose.Types.ObjectId(campaignId);

    const campaign = await CampaignModel.findOne({
      _id: campObjId,
      organizationId: orgObjId,
    }).lean();

    if (!campaign) {
      return null;
    }

    // Fetch all recipients, tracking links, and delivery jobs
    const [recipients, links, jobs] = await Promise.all([
      CampaignRecipientModel.find({ campaignId: campObjId, organizationId: orgObjId })
        .populate("recipientId", "phone name customId")
        .lean(),
      TrackingLinkModel.find({ campaignId: campObjId, organizationId: orgObjId }).lean(),
      DeliveryJobModel.find({ campaignId: campObjId, organizationId: orgObjId }).lean(),
    ]);

    // Build lookup maps
    const linkMap = new Map<string, any>();
    for (const l of links) {
      linkMap.set(l.recipientId.toString(), l);
      linkMap.set(l.trackingId, l);
    }

    const jobMap = new Map<string, any>();
    for (const j of jobs) {
      jobMap.set(j.recipientId.toString(), j);
    }

    let combined = recipients.map((r: any) => {
      const recipId = r.recipientId?._id?.toString() || r.recipientId?.toString() || "";
      const phone = r.recipientId?.phone || r.phone || "";
      const name = r.recipientId?.name || "Customer";
      const customId = r.recipientId?.customId || "";

      const link = linkMap.get(recipId) || linkMap.get(r.trackingId) || {};
      const job = jobMap.get(recipId) || {};

      const clicks = link.clickCount || r.clickCount || 0;
      const status = job.status || r.status || "queued";

      return {
        _id: r._id,
        recipientId: recipId,
        phone,
        name,
        customId,
        status,
        sentAt: job.sentAt || null,
        deliveredAt: job.deliveredAt || null,
        trackingId: link.trackingId || r.trackingId || "",
        uniqueUrl: link.uniqueUrl || "",
        destinationUrl: link.destinationUrl || campaign.trackingConfig?.destinationUrl || "",
        clickCount: clicks,
        firstClickedAt: link.firstClickedAt || null,
        lastClickedAt: link.lastClickedAt || null,
        isHighIntent: clicks >= 2,
        isClicked: clicks > 0,
        errorMessage: job.errorMessage || null,
      };
    });

    // Summary calculations on all records
    const allSummary = {
      totalRecipients: campaign.recipientCount || combined.length,
      delivered: combined.filter((i) => i.status === "delivered").length,
      sent: combined.filter((i) => ["sent", "delivered"].includes(i.status)).length,
      failed: combined.filter((i) => i.status === "failed").length,
      queued: combined.filter((i) => ["queued", "processing"].includes(i.status)).length,
      totalClicks: combined.reduce((acc, curr) => acc + curr.clickCount, 0),
      uniqueClickers: combined.filter((i) => i.clickCount > 0).length,
      highIntentLeads: combined.filter((i) => i.clickCount >= 2).length,
    };

    // Apply filtering
    if (options.search) {
      const q = options.search.toLowerCase().trim();
      combined = combined.filter(
        (item) =>
          item.phone.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.trackingId.toLowerCase().includes(q)
      );
    }

    if (options.status && options.status !== "all") {
      combined = combined.filter((item) => item.status === options.status);
    }

    if (options.filter === "clicked") {
      combined = combined.filter((item) => item.clickCount > 0);
    } else if (options.filter === "high_intent") {
      combined = combined.filter((item) => item.clickCount >= 2);
    } else if (options.filter === "delivered") {
      combined = combined.filter((item) => item.status === "delivered");
    } else if (options.filter === "failed") {
      combined = combined.filter((item) => item.status === "failed");
    }

    const total = combined.length;
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(200, Math.max(1, options.limit || 50));
    const skip = (page - 1) * limit;

    const pagedRecipients = combined.slice(skip, skip + limit);

    return {
      campaign,
      recipients: pagedRecipients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: allSummary,
    };
  }

  /**
   * Permanently deletes a campaign and performs full cascade deletion of all
   * associated recipients, queue delivery jobs, unique tracking links, and click events.
   */
  static async deleteCampaign(
    organizationId: string,
    campaignId: string,
    userId?: string
  ): Promise<{ success: boolean; deletedCounts: Record<string, number> }> {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const campObjId = new mongoose.Types.ObjectId(campaignId);

    const campaign = await CampaignModel.findOne({ _id: campObjId, organizationId: orgObjId });
    if (!campaign) {
      return { success: false, deletedCounts: {} };
    }

    // Cascade delete all associated records across collections
    const [recipientsRes, linksRes, jobsRes, clicksRes, campRes] = await Promise.all([
      CampaignRecipientModel.deleteMany({ campaignId: campObjId, organizationId: orgObjId }),
      TrackingLinkModel.deleteMany({ campaignId: campObjId, organizationId: orgObjId }),
      DeliveryJobModel.deleteMany({ campaignId: campObjId, organizationId: orgObjId }),
      ClickEventModel.deleteMany({ campaignId: campObjId, organizationId: orgObjId }),
      CampaignModel.deleteOne({ _id: campObjId, organizationId: orgObjId }),
    ]);

    // Log deletion audit event
    if (userId) {
      await AuditLogModel.create({
        organizationId: orgObjId,
        userId: new mongoose.Types.ObjectId(userId),
        action: "CAMPAIGN_DELETED",
        resourceType: "campaign",
        resourceId: campaignId,
        metadata: {
          campaignName: campaign.name,
          deletedRecipients: recipientsRes.deletedCount,
          deletedLinks: linksRes.deletedCount,
          deletedJobs: jobsRes.deletedCount,
          deletedClicks: clicksRes.deletedCount,
        },
      });
    }

    return {
      success: true,
      deletedCounts: {
        recipients: recipientsRes.deletedCount || 0,
        trackingLinks: linksRes.deletedCount || 0,
        deliveryJobs: jobsRes.deletedCount || 0,
        clickEvents: clicksRes.deletedCount || 0,
        campaigns: campRes.deletedCount || 0,
      },
    };
  }
}
