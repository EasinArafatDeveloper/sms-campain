import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import {
  CampaignModel,
  RecipientModel,
  CampaignRecipientModel,
  TrackingLinkModel,
  DeliveryJobModel,
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

    const format = data.trackingFormat || "numeric";
    const length = data.trackingLength || 6;
    const destUrl = data.destinationUrl.trim();

    // 1. Create Campaign Document in 'draft' or 'generating_links'
    const campaign = await CampaignModel.create({
      organizationId: orgObjId,
      name: data.name.trim(),
      senderId: data.senderId.trim(),
      message: data.message,
      destinationUrl: destUrl,
      trackingFormat: format,
      trackingLength: length,
      status: "queued",
      statistics: {
        totalRecipients: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        queued: 0,
        totalClicks: 0,
        uniqueClicks: 0,
        engagementScore: 0,
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
          resolvedBase = `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")}/t`;
        } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
          resolvedBase = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/t`;
        } else if (process.env.VERCEL_URL) {
          resolvedBase = `https://${process.env.VERCEL_URL}/t`;
        } else {
          resolvedBase = "http://localhost:3000/t";
        }
      } else {
        if (!resolvedBase.endsWith("/t") && !resolvedBase.endsWith("/t/")) {
          resolvedBase = `${resolvedBase.replace(/\/+$/, "")}/t`;
        }
      }
      const appBaseUrl = resolvedBase.replace(/\/+$/, "");

      const trackingLinksToInsert: any[] = [];
      const campaignRecipientsToInsert: any[] = [];
      const deliveryJobsToInsert: any[] = [];

      for (let i = 0; i < totalRecipients; i++) {
        const item = recipientsList[i];
        const trackingId = trackingIds[i];
        const uniqueUrl = `${appBaseUrl}/${trackingId}`;

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
          provider: "bulksmsbd",
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
}
