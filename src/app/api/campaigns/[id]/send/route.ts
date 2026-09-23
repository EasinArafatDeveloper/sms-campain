import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { CampaignModel, OrganizationModel, ApiCredentialModel } from "@/lib/db/models";
import { CampaignService } from "@/lib/services/campaign.service";
import { DeliveryService } from "@/lib/services/delivery.service";
import { queueSmsBatch } from "@/lib/queue";
import { connectToDatabase } from "@/lib/db/connect";
import mongoose from "mongoose";

// Campaigns can only be (re)sent from these states — never while already sending/completed/cancelled.
const SENDABLE_STATUSES = ["draft", "scheduled", "paused", "failed"];

export const POST = withTenant(
  async (req: NextRequest, ctx: TenantContext) => {
    try {
      const id = ctx.params.id;
      const orgId = ctx.organizationId;

      if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
      }

      await connectToDatabase();
      const orgObjId = new mongoose.Types.ObjectId(orgId);
      const campObjId = new mongoose.Types.ObjectId(id);

      // Atomically claim the campaign for sending so a double click (or a retried
      // request) can never start two overlapping dispatch runs for it.
      const campaign = await CampaignModel.findOneAndUpdate(
        { _id: campObjId, organizationId: orgObjId, status: { $in: SENDABLE_STATUSES } },
        { $set: { status: "sending" } },
        { new: true }
      );

      if (!campaign) {
        const existing = await CampaignModel.findOne({ _id: campObjId, organizationId: orgObjId }).select("status").lean();
        if (!existing) {
          return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }
        return NextResponse.json(
          { error: `Campaign cannot be sent from its current status ("${existing.status}").` },
          { status: 409 }
        );
      }

      // A tenant with their own working ZendSMS key (BYOK) is billed by ZendSMS directly,
      // so platform SMS credits are neither required nor deducted for them.
      const hasOwnGateway = await ApiCredentialModel.exists({
        organizationId: orgObjId,
        isDefault: true,
        apiKey: { $exists: true, $ne: "" },
      });

      if (!hasOwnGateway) {
        const org = await OrganizationModel.findById(orgObjId).select("smsCredits").lean();
        if (!org || org.smsCredits <= 0) {
          // Roll the claim back so the campaign stays sendable once credits are topped up.
          await CampaignModel.updateOne({ _id: campObjId }, { $set: { status: "draft" } });
          return NextResponse.json(
            {
              error: "Insufficient SMS Credits",
              message: "Your organization has 0 SMS credits remaining. Please top up or configure your own ZendSMS API key in Settings.",
              currentBalance: org?.smsCredits ?? 0,
            },
            { status: 402 }
          );
        }
      }

      // Build the DeliveryJob dispatch queue now (never at campaign creation time).
      const { enqueued, alreadyEnqueued } = await CampaignService.enqueueForDelivery(orgId, id);
      if (enqueued === 0 && !alreadyEnqueued) {
        await CampaignModel.updateOne({ _id: campObjId }, { $set: { status: "failed" } });
        return NextResponse.json({ error: "Campaign has no recipients to send to." }, { status: 400 });
      }

      // Trigger the queue (Redis worker or in-process fallback) and run an initial batch now.
      await queueSmsBatch(orgId, id);
      const result = await DeliveryService.processBatch(orgId, 50, id);

      return NextResponse.json({
        success: true,
        message: alreadyEnqueued ? "Campaign dispatch resumed" : "Campaign queued and dispatch started",
        enqueued,
        dispatchedInitial: result,
      });
    } catch (err: any) {
      console.error("[Campaign Send API] Error:", err);
      return NextResponse.json({ error: "Failed to dispatch campaign" }, { status: 500 });
    }
  },
  { requiredRoles: ["owner", "admin"], requirePhoneVerified: true }
);
