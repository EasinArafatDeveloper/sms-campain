import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { CampaignModel, OrganizationModel } from "@/lib/db/models";
import { DeliveryService } from "@/lib/services/delivery.service";
import { queueSmsBatch } from "@/lib/queue";
import { connectToDatabase } from "@/lib/db/connect";
import mongoose from "mongoose";

export const POST = withTenant(async (req: NextRequest, ctx: TenantContext) => {
  try {
    const id = ctx.params.id;
    const orgId = ctx.organizationId;

    await connectToDatabase();
    const campaign = await CampaignModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: new mongoose.Types.ObjectId(orgId),
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Check organization SMS credits
    const org = await OrganizationModel.findById(orgId);
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (org.smsCredits <= 0) {
      return NextResponse.json(
        {
          error: "Insufficient SMS Credits",
          message: "Your organization has 0 SMS credits remaining. Please top up or contact support.",
          currentBalance: org.smsCredits,
        },
        { status: 402 }
      );
    }

    campaign.status = "sending";
    await campaign.save();

    // Trigger queue batch or in-memory batch processor
    await queueSmsBatch(orgId, id);

    // Run initial dispatch scoped to this campaign
    const result = await DeliveryService.processBatch(orgId, 50, id);

    return NextResponse.json({
      success: true,
      message: "Campaign queued and dispatch started",
      dispatchedInitial: result,
      remainingCredits: org.smsCredits - result.sent,
    });
  } catch (err: any) {
    console.error("[Campaign Send API] Error:", err);
    return NextResponse.json({ error: "Failed to dispatch campaign" }, { status: 500 });
  }
});
