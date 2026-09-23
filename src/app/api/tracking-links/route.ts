import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { CampaignRecipientModel } from "@/lib/db/models";
import { connectToDatabase } from "@/lib/db/connect";
import { escapeRegex } from "@/lib/security";
import mongoose from "mongoose";

/**
 * Lists each recipient's personal short link for the Tracking Links page.
 *
 * Backed by CampaignRecipientModel (not DeliveryJobModel / the delivery queue) on
 * purpose: every recipient's link is generated the moment a campaign is created, long
 * before the DeliveryJob dispatch queue exists — that only gets built when the
 * campaign is actually sent. Sourcing this from the delivery queue would leave the
 * page empty for every campaign that hasn't been sent yet.
 */
export const GET = withTenant(async (req: NextRequest, ctx: TenantContext) => {
  try {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(ctx.organizationId);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const search = searchParams.get("search") || "";
    const campaignId = searchParams.get("campaignId") || undefined;

    const query: any = { organizationId: orgObjId };
    if (campaignId && mongoose.isValidObjectId(campaignId)) {
      query.campaignId = new mongoose.Types.ObjectId(campaignId);
    }
    if (search) {
      const safe = escapeRegex(search);
      query.$or = [{ phone: { $regex: safe, $options: "i" } }, { trackingId: { $regex: safe, $options: "i" } }];
    }

    const skip = (page - 1) * limit;
    const [links, total] = await Promise.all([
      CampaignRecipientModel.find(query)
        .select("phone trackingId trackingUrl clickStatus clickCount")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CampaignRecipientModel.countDocuments(query),
    ]);

    return NextResponse.json({
      links,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error("[Tracking Links API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch tracking links" }, { status: 500 });
  }
});
