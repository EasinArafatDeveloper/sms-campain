import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { CampaignModel, CampaignRecipientModel } from "@/lib/db/models";
import { connectToDatabase } from "@/lib/db/connect";
import { escapeRegex } from "@/lib/security";
import mongoose from "mongoose";

/**
 * SuperAdmin-only: for any tenant's campaign, list exactly who was actually sent an
 * SMS — phone number, the personalized message, delivery status, and click stats.
 * Backs the "SMS Recipients" drill-down from an audit log entry.
 */
export const GET = withTenant(
  async (req: NextRequest, ctx: TenantContext) => {
    try {
      const campaignId = ctx.params.id;
      if (!mongoose.isValidObjectId(campaignId)) {
        return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
      }

      await connectToDatabase();
      const campObjId = new mongoose.Types.ObjectId(campaignId);

      const campaign = await CampaignModel.findById(campObjId)
        .select("name status senderId message organizationId recipientCount")
        .populate("organizationId", "name slug")
        .lean();

      if (!campaign) {
        return NextResponse.json({ error: "Campaign not found (it may have been deleted)" }, { status: 404 });
      }

      const { searchParams } = new URL(req.url);
      const search = searchParams.get("search") || "";
      const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const skip = (page - 1) * limit;

      const query: any = { campaignId: campObjId };
      if (search) {
        query.phone = { $regex: escapeRegex(search), $options: "i" };
      }

      const [recipients, total, sentCount] = await Promise.all([
        CampaignRecipientModel.find(query)
          .select(
            "phone recipientName personalizedMessage trackingId trackingUrl deliveryStatus clickStatus clickCount sentAt deliveredAt providerMessageId errorMessage"
          )
          .sort({ createdAt: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        CampaignRecipientModel.countDocuments(query),
        CampaignRecipientModel.countDocuments({
          campaignId: campObjId,
          deliveryStatus: { $in: ["sent", "delivered"] },
        }),
      ]);

      return NextResponse.json({
        campaign: {
          _id: campaign._id,
          name: campaign.name,
          status: campaign.status,
          senderId: campaign.senderId,
          message: campaign.message,
          organization: campaign.organizationId,
          totalRecipients: campaign.recipientCount,
          sentCount,
        },
        recipients,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err: any) {
      console.error("[Admin Campaign Recipients API] Error:", err);
      return NextResponse.json({ error: "Failed to fetch campaign recipients" }, { status: 500 });
    }
  },
  { requireSuperAdmin: true }
);
