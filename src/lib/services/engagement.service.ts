import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { EngagementProfileModel, RecipientModel, CampaignRecipientModel } from "@/lib/db/models";
import { LeadStatus } from "@/types";

export class EngagementService {
  /**
   * Computes engagement score and classifies lead status based on configurable rules.
   */
  static calculateScoreAndStatus(
    campaignsClickedCount: number,
    totalClicks: number,
    lastClickAt?: Date
  ): { score: number; status: LeadStatus } {
    if (totalClicks === 0 || !lastClickAt) {
      return { score: 0, status: "inactive" };
    }

    const now = new Date();
    const daysSinceLastClick = Math.floor((now.getTime() - new Date(lastClickAt).getTime()) / (1000 * 60 * 60 * 24));

    // Base score components
    let score = campaignsClickedCount * 25 + totalClicks * 10;

    // Recency bonus
    if (daysSinceLastClick <= 7) {
      score += 20;
    } else if (daysSinceLastClick <= 30) {
      score += 10;
    } else {
      score = Math.max(10, score - 15);
    }

    // Clamp score to 100 max
    score = Math.min(100, Math.max(0, Math.round(score)));

    // Enterprise Lead Classification Rules:
    // 1. Highly Active / High-Intent: >= 3 campaigns clicked AND >= 2 total clicks AND last click <= 30 days
    if (campaignsClickedCount >= 3 && totalClicks >= 2 && daysSinceLastClick <= 30) {
      return { score: Math.max(score, 80), status: "highly_active" };
    }

    // 2. Engaged: >= 1 campaign clicked AND last click <= 60 days
    if (campaignsClickedCount >= 1 && daysSinceLastClick <= 60) {
      return { score: Math.max(score, 45), status: "engaged" };
    }

    // 3. Low Engagement
    return { score, status: "low_engagement" };
  }

  /**
   * Records a click event into the recipient's engagement profile and updates score/status.
   */
  static async recordRecipientClick(
    organizationId: string,
    recipientId: string,
    campaignId: string,
    clickedAt: Date = new Date()
  ): Promise<void> {
    await connectToDatabase();

    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const recipObjId = new mongoose.Types.ObjectId(recipientId);
    const campObjId = new mongoose.Types.ObjectId(campaignId);

    let profile = await EngagementProfileModel.findOne({
      organizationId: orgObjId,
      recipientId: recipObjId,
    });

    if (!profile) {
      const recipient = await RecipientModel.findById(recipObjId);
      profile = new EngagementProfileModel({
        organizationId: orgObjId,
        recipientId: recipObjId,
        phone: recipient?.phone || "",
        recipientName: recipient?.name || "",
        campaignsReceived: 1,
        campaignsClicked: 1,
        campaignIdsClicked: [campObjId],
        totalClicks: 1,
        firstClickAt: clickedAt,
        lastClickAt: clickedAt,
        engagementScore: 50,
        leadStatus: "engaged",
      });
    } else {
      profile.totalClicks += 1;
      profile.lastClickAt = clickedAt;
      if (!profile.firstClickAt) {
        profile.firstClickAt = clickedAt;
      }

      const hasCampaign = profile.campaignIdsClicked.some((id) => id.toString() === campaignId);
      if (!hasCampaign) {
        profile.campaignIdsClicked.push(campObjId);
        profile.campaignsClicked = profile.campaignIdsClicked.length;
      }
    }

    const { score, status } = this.calculateScoreAndStatus(
      profile.campaignsClicked,
      profile.totalClicks,
      profile.lastClickAt
    );

    profile.engagementScore = score;
    profile.leadStatus = status;

    await profile.save();
  }

  /**
   * Calculates dynamic budget optimization metrics for active leads.
   */
  static async getBudgetOptimizationSummary(organizationId: string): Promise<{
    totalAudience: number;
    highlyActiveCount: number;
    engagedCount: number;
    lowEngagementCount: number;
    recommendedAudienceCount: number;
    volumeReductionPercent: number;
    estimatedCostSavingsPercent: number;
  }> {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const totalAudience = await RecipientModel.countDocuments({ organizationId: orgObjId });
    const highlyActiveCount = await EngagementProfileModel.countDocuments({
      organizationId: orgObjId,
      leadStatus: "highly_active",
    });
    const engagedCount = await EngagementProfileModel.countDocuments({
      organizationId: orgObjId,
      leadStatus: "engaged",
    });
    const lowEngagementCount = Math.max(0, totalAudience - highlyActiveCount - engagedCount);

    const recommendedAudienceCount = highlyActiveCount;
    const reduction =
      totalAudience > 0 ? ((totalAudience - recommendedAudienceCount) / totalAudience) * 100 : 0;

    return {
      totalAudience,
      highlyActiveCount,
      engagedCount,
      lowEngagementCount,
      recommendedAudienceCount,
      volumeReductionPercent: Number(reduction.toFixed(1)),
      estimatedCostSavingsPercent: Number(reduction.toFixed(1)),
    };
  }
}
