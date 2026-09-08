import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import {
  ClickEventModel,
  CampaignModel,
  CampaignRecipientModel,
  EngagementProfileModel,
} from "@/lib/db/models";
import { PaginatedResult } from "@/types";

export class AnalyticsService {
  /**
   * Retrieves Click Analytics KPIs and Funnel for the analytics screen.
   */
  static async getClickAnalyticsMetrics(organizationId: string, campaignId?: string) {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const match: any = { organizationId: orgObjId };
    if (campaignId && campaignId !== "all") {
      match._id = new mongoose.Types.ObjectId(campaignId);
    }

    const campaignStats = await CampaignModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          smsSent: { $sum: "$statistics.sent" },
          delivered: { $sum: "$statistics.delivered" },
          totalClicks: { $sum: "$statistics.totalClicks" },
          uniqueClickers: { $sum: "$statistics.uniqueClickers" },
          repeatClickers: { $sum: "$statistics.repeatClickers" },
          highIntentLeads: { $sum: "$statistics.highIntentLeads" },
        },
      },
    ]);

    const s = campaignStats[0] || {};
    const smsSent = s.smsSent || 0;
    const delivered = s.delivered || 0;
    const totalClicks = s.totalClicks || 0;
    const uniqueClickers = s.uniqueClickers || 0;
    const repeatClickers = s.repeatClickers || 0;
    const highIntentLeads = s.highIntentLeads || 0;

    const clickRate = delivered > 0 ? Number(((uniqueClickers / delivered) * 100).toFixed(1)) : 0;

    // Real click events for trend
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const clickEvents = await ClickEventModel.aggregate([
      { $match: { organizationId: orgObjId, clickedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%b %d", date: "$clickedAt" } },
          totalClicks: { $sum: 1 },
          uniqueUsers: { $addToSet: "$recipientId" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const trend = clickEvents.map((c) => ({
      date: c._id,
      totalClicks: c.totalClicks,
      uniqueClicks: c.uniqueUsers?.length || 0,
    }));

    return {
      smsSent,
      delivered,
      totalClicks,
      uniqueClickers,
      clickRate,
      repeatClickers,
      highIntentLeads,
      funnel: [
        { label: "SMS Sent", count: smsSent, percent: 100, color: "#2563EB" },
        { label: "Delivered", count: delivered, percent: smsSent > 0 ? Number(((delivered / smsSent) * 100).toFixed(1)) : 0, color: "#3B82F6" },
        { label: "Unique Clickers", count: uniqueClickers, percent: delivered > 0 ? Number(((uniqueClickers / delivered) * 100).toFixed(1)) : 0, color: "#7C3AED" },
        { label: "Repeat Clickers", count: repeatClickers, percent: uniqueClickers > 0 ? Number(((repeatClickers / uniqueClickers) * 100).toFixed(1)) : 0, color: "#8B5CF6" },
        { label: "High Intent", count: highIntentLeads, percent: repeatClickers > 0 ? Number(((highIntentLeads / repeatClickers) * 100).toFixed(1)) : 0, color: "#10B981" },
      ],
      trend,
    };
  }

  /**
   * Retrieves User-Level Click Attribution table.
   */
  static async listUserAttributions(
    organizationId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      campaignId?: string;
    } = {}
  ): Promise<PaginatedResult<any>> {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    const matchQuery: any = { organizationId: orgObjId, clickStatus: "clicked" };

    if (options.campaignId && options.campaignId !== "all") {
      matchQuery.campaignId = new mongoose.Types.ObjectId(options.campaignId);
    }

    if (options.search) {
      matchQuery.$or = [
        { phone: { $regex: options.search, $options: "i" } },
        { trackingId: { $regex: options.search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      CampaignRecipientModel.find(matchQuery)
        .sort({ lastClickedAt: -1, clickCount: -1 })
        .skip(skip)
        .limit(limit)
        .populate("campaignId", "name")
        .populate("recipientId", "customId")
        .lean(),
      CampaignRecipientModel.countDocuments(matchQuery),
    ]);

    const formatted = items.map((item: any, index: number) => {
      const clickCount = item.clickCount || 1;
      const score = Math.min(100, clickCount * 18 + 40);
      const isHighIntent = clickCount >= 3;
      const customId = item.recipientId?.customId || `USR-${item.phone ? item.phone.slice(-4) : "0000"}`;

      return {
        _id: item._id,
        userId: customId,
        phone: item.phone,
        campaignName: item.campaignId?.name || "Direct Broadcast",
        trackingId: item.trackingId || "-",
        clicks: clickCount,
        firstClick: item.firstClickedAt || item.createdAt || new Date(),
        lastClick: item.lastClickedAt || item.firstClickedAt || new Date(),
        campaignsCount: Math.max(1, Math.floor(clickCount / 2)),
        score,
        status: isHighIntent ? "High Intent" : "Active",
      };
    });

    return {
      data: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
