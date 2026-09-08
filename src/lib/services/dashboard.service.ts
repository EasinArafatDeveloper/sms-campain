import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import {
  CampaignModel,
  ClickEventModel,
  EngagementProfileModel,
  RecipientModel,
} from "@/lib/db/models";
import { DashboardMetrics } from "@/types";

export class DashboardService {
  /**
   * Retrieves aggregated dashboard metrics computed from live database collections.
   */
  static async getMetrics(organizationId: string): Promise<DashboardMetrics> {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    // Aggregate campaign totals
    const campaignStats = await CampaignModel.aggregate([
      { $match: { organizationId: orgObjId } },
      {
        $group: {
          _id: null,
          totalCampaigns: { $sum: 1 },
          smsSent: { $sum: "$statistics.sent" },
          delivered: { $sum: "$statistics.delivered" },
          totalClicks: { $sum: "$statistics.totalClicks" },
          uniqueClickers: { $sum: "$statistics.uniqueClickers" },
          repeatClickers: { $sum: "$statistics.repeatClickers" },
          highIntentLeads: { $sum: "$statistics.highIntentLeads" },
        },
      },
    ]);

    const stats = campaignStats[0] || {
      totalCampaigns: 0,
      smsSent: 0,
      delivered: 0,
      totalClicks: 0,
      uniqueClickers: 0,
      repeatClickers: 0,
      highIntentLeads: 0,
    };

    const smsSent = stats.smsSent || 0;
    const delivered = stats.delivered || 0;
    const totalClicks = stats.totalClicks || 0;
    const uniqueClickers = stats.uniqueClickers || 0;
    const repeatClickers = stats.repeatClickers || 0;
    const highIntentLeads = stats.highIntentLeads || 0;

    const deliveryRate = smsSent > 0 ? (delivered / smsSent) * 100 : 0;
    const clickRate = delivered > 0 ? (uniqueClickers / delivered) * 100 : 0;

    // Fetch recent campaigns
    const recentCampaigns = await CampaignModel.find({ organizationId: orgObjId })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    // Fetch Lead distribution
    const leadCounts = await EngagementProfileModel.aggregate([
      { $match: { organizationId: orgObjId } },
      { $group: { _id: "$leadStatus", count: { $sum: 1 } } },
    ]);

    let highlyActive = 0;
    let engaged = 0;
    let lowEngagement = 0;

    leadCounts.forEach((item) => {
      if (item._id === "highly_active") highlyActive = item.count;
      else if (item._id === "engaged") engaged = item.count;
      else if (item._id === "low_engagement" || item._id === "inactive") lowEngagement += item.count;
    });

    const totalAudience = await RecipientModel.countDocuments({ organizationId: orgObjId });
    const potentialReductionPercent =
      totalAudience > 0 ? Number((((totalAudience - highlyActive) / totalAudience) * 100).toFixed(1)) : 0;

    // Click engagement trend (aggregating real daily click events)
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

    const clickTrend = clickEvents.map((c) => ({
      date: c._id,
      totalClicks: c.totalClicks,
      uniqueClicks: c.uniqueUsers?.length || 0,
    }));

    return {
      totalCampaigns: stats.totalCampaigns || (await CampaignModel.countDocuments({ organizationId: orgObjId })),
      smsSent,
      delivered,
      deliveryRate: Number(deliveryRate.toFixed(1)),
      totalClicks,
      uniqueClickers,
      clickRate: Number(clickRate.toFixed(1)),
      repeatClickers,
      highIntentLeads,
      potentialReductionPercent,
      recentCampaigns: recentCampaigns as any,
      clickTrend,
      funnel: {
        sent: smsSent,
        delivered,
        uniqueClickers,
        repeatClickers,
        highIntentLeads,
      },
      leadDistribution: {
        highlyActive,
        engaged,
        lowEngagement,
        total: totalAudience,
      },
    };
  }
}
