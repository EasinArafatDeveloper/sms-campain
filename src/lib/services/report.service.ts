import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import {
  CampaignModel,
  RecipientModel,
  CampaignRecipientModel,
  EngagementProfileModel,
  TrackingLinkModel,
  DeliveryJobModel,
} from "@/lib/db/models";

export class ReportService {
  /**
   * Generates comprehensive performance reports across campaigns, delivery, and ROI.
   */
  static async getReportsSummary(organizationId: string) {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const campaigns = await CampaignModel.find({ organizationId: orgObjId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    let totalSent = 0;
    let totalDelivered = 0;
    let totalClicks = 0;
    let totalHighIntent = 0;

    const campaignReports = campaigns.map((c) => {
      const sent = c.statistics?.sent || 0;
      const delivered = c.statistics?.delivered || 0;
      const clicks = c.statistics?.totalClicks || 0;
      const uniqueClickers = c.statistics?.uniqueClickers || 0;
      const highIntent = c.statistics?.highIntentLeads || 0;

      totalSent += sent;
      totalDelivered += delivered;
      totalClicks += clicks;
      totalHighIntent += highIntent;

      const deliveryRate = sent > 0 ? Number(((delivered / sent) * 100).toFixed(1)) : 0;
      const clickRate = delivered > 0 ? Number(((uniqueClickers / delivered) * 100).toFixed(1)) : 0;

      return {
        _id: c._id,
        name: c.name,
        senderId: c.senderId,
        date: c.createdAt,
        status: c.status,
        sent,
        delivered,
        deliveryRate,
        clicks,
        uniqueClickers,
        clickRate,
        highIntent,
      };
    });

    const averageDeliveryRate = totalSent > 0 ? Number(((totalDelivered / totalSent) * 100).toFixed(1)) : 0;
    const averageClickRate = totalDelivered > 0 ? Number(((totalClicks / totalDelivered) * 100).toFixed(1)) : 0;

    return {
      overview: {
        totalCampaigns: campaigns.length,
        totalSent,
        totalDelivered,
        averageDeliveryRate,
        totalClicks,
        averageClickRate,
        highIntentLeadsGenerated: totalHighIntent,
      },
      campaigns: campaignReports,
    };
  }
}

export class ExportService {
  /**
   * Generates CSV format string from array of objects.
   */
  static generateCsv(data: Record<string, any>[]): string {
    if (!data || data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const headerLine = headers.join(",");
    const rows = data.map((row) =>
      headers
        .map((h) => {
          let val = row[h];
          if (val === undefined || val === null) val = "";
          val = String(val).replace(/"/g, '""');
          if (val.includes(",") || val.includes("\n") || val.includes('"')) {
            val = `"${val}"`;
          }
          return val;
        })
        .join(",")
    );
    return [headerLine, ...rows].join("\n");
  }

  /**
   * Exports audience segment leads.
   */
  static async exportActiveLeadsCsv(organizationId: string): Promise<string> {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const leads = await EngagementProfileModel.find({ organizationId: orgObjId })
      .sort({ engagementScore: -1 })
      .populate("recipientId", "customId")
      .lean();

    const formatted = leads.map((l: any) => ({
      "User ID": l.recipientId?.customId || l.phone || `LEAD-${String(l._id).slice(-6)}`,
      "Phone": l.phone,
      "Name": l.recipientName || "—",
      "Campaigns Clicked": l.campaignsClicked || 0,
      "Total Clicks": l.totalClicks || 0,
      "Last Click": l.lastClickAt ? new Date(l.lastClickAt).toISOString() : "",
      "Engagement Score": l.engagementScore || 0,
      "Lead Status": l.leadStatus || "standard",
    }));

    return this.generateCsv(formatted);
  }

  /**
   * Exports tracking link mappings for a campaign.
   */
  static async exportTrackingMappingsCsv(organizationId: string, campaignId: string): Promise<string> {
    await connectToDatabase();
    const links = await TrackingLinkModel.find({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      campaignId: new mongoose.Types.ObjectId(campaignId),
    })
      .populate("recipientId", "phone name")
      .lean();

    const formatted = links.map((l: any) => ({
      "Tracking ID": l.trackingId,
      "Phone": l.recipientId?.phone || "",
      "Recipient Name": l.recipientId?.name || "",
      "Unique Tracking URL": l.uniqueUrl,
      "Destination URL": l.destinationUrl,
      "Clicks": l.clickCount,
      "Created At": new Date(l.createdAt).toISOString(),
    }));

    return this.generateCsv(formatted);
  }

  /**
   * Generates a comprehensive per-recipient delivery, click, and engagement report CSV for a campaign.
   */
  static async exportCampaignReportCsv(organizationId: string, campaignId: string): Promise<{ csv: string; campaignName: string }> {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const campObjId = new mongoose.Types.ObjectId(campaignId);

    const campaign = await CampaignModel.findOne({ _id: campObjId, organizationId: orgObjId }).lean();
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const [recipients, links, jobs] = await Promise.all([
      CampaignRecipientModel.find({ campaignId: campObjId, organizationId: orgObjId })
        .populate("recipientId", "phone name customId")
        .lean(),
      TrackingLinkModel.find({ campaignId: campObjId, organizationId: orgObjId }).lean(),
      DeliveryJobModel.find({ campaignId: campObjId, organizationId: orgObjId }).lean(),
    ]);

    // Build lookup maps for fast correlation
    const linkMap = new Map<string, any>();
    for (const l of links) {
      linkMap.set(l.recipientId.toString(), l);
      linkMap.set(l.trackingId, l);
    }

    const jobMap = new Map<string, any>();
    for (const j of jobs) {
      jobMap.set(j.recipientId.toString(), j);
    }

    const rows = recipients.map((r: any) => {
      const recipId = r.recipientId?._id?.toString() || r.recipientId?.toString() || "";
      const phone = r.recipientId?.phone || r.phone || "";
      const name = r.recipientId?.name || "Customer";
      const customId = r.recipientId?.customId || "";
      
      const link = linkMap.get(recipId) || linkMap.get(r.trackingId) || {};
      const job = jobMap.get(recipId) || {};

      const clicks = link.clickCount || r.clickCount || 0;
      const status = job.status || r.status || "queued";

      let engagementLevel = "Not Clicked";
      if (clicks >= 2) engagementLevel = "High Intent (Repeat Clicker)";
      else if (clicks === 1) engagementLevel = "Engaged (Single Click)";

      return {
        "Campaign Name": campaign.name,
        "Sender ID": campaign.senderId,
        "Customer Name": name,
        "Phone Number": phone,
        "Customer ID": customId,
        "SMS Status": status.toUpperCase(),
        "SMS Sent Time": job.sentAt ? new Date(job.sentAt).toISOString() : "",
        "SMS Delivered Time": job.deliveredAt ? new Date(job.deliveredAt).toISOString() : "",
        "Tracking Short Code": link.trackingId || r.trackingId || "",
        "Personalized Tracking URL": link.uniqueUrl || "",
        "Destination URL": link.destinationUrl || campaign.trackingConfig?.destinationUrl || "",
        "Total Link Clicks": clicks,
        "First Clicked At": link.firstClickedAt ? new Date(link.firstClickedAt).toISOString() : "",
        "Last Clicked At": link.lastClickedAt ? new Date(link.lastClickedAt).toISOString() : "",
        "Engagement Level": engagementLevel,
        "Delivery Error Reason": job.errorMessage || "",
      };
    });

    const csv = this.generateCsv(rows);
    return { csv, campaignName: campaign.name };
  }

  /**
   * Generates a high-level aggregate CSV report of all campaigns.
   */
  static async exportAllCampaignsReportCsv(organizationId: string): Promise<string> {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const campaigns = await CampaignModel.find({ organizationId: orgObjId })
      .sort({ createdAt: -1 })
      .lean();

    const rows = campaigns.map((c: any) => {
      const stats = c.statistics || {};
      const sent = stats.sent || c.recipientCount || 0;
      const delivered = stats.delivered || 0;
      const totalClicks = stats.totalClicks || 0;
      const uniqueClickers = stats.uniqueClickers || 0;
      const highIntent = stats.highIntentLeads || 0;

      const deliveryRate = sent > 0 ? Number(((delivered / sent) * 100).toFixed(1)) : 0;
      const ctr = delivered > 0 ? Number(((uniqueClickers / delivered) * 100).toFixed(1)) : 0;

      return {
        "Campaign ID": c._id.toString(),
        "Campaign Name": c.name,
        "Sender ID": c.senderId,
        "Status": (c.status || "queued").toUpperCase(),
        "Created At": new Date(c.createdAt).toISOString(),
        "Scheduled At": c.scheduledAt ? new Date(c.scheduledAt).toISOString() : "Immediate",
        "Total Recipients": c.recipientCount || 0,
        "SMS Sent": sent,
        "SMS Delivered": delivered,
        "Delivery Rate (%)": `${deliveryRate}%`,
        "Total Clicks": totalClicks,
        "Unique Clickers": uniqueClickers,
        "Click-Through Rate (CTR %)": `${ctr}%`,
        "High Intent Leads": highIntent,
        "Destination URL": c.trackingConfig?.destinationUrl || "",
        "URL Format": c.trackingConfig?.format || "alphanumeric",
        "URL Prefix": c.trackingConfig?.urlPrefix || "eid",
      };
    });

    return this.generateCsv(rows);
  }
}
