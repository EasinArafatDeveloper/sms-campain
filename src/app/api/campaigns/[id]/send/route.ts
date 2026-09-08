import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { CampaignModel } from "@/lib/db/models";
import { DeliveryService } from "@/lib/services/delivery.service";
import { queueSmsBatch } from "@/lib/queue";
import { connectToDatabase } from "@/lib/db/connect";
import mongoose from "mongoose";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";

    await connectToDatabase();
    const campaign = await CampaignModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      organizationId: new mongoose.Types.ObjectId(orgId),
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    campaign.status = "sending";
    await campaign.save();

    // Trigger queue batch or in-memory batch processor
    await queueSmsBatch(orgId, id);

    // Run initial dispatch
    const result = await DeliveryService.processBatch(orgId, 50);

    return NextResponse.json({
      success: true,
      message: "Campaign queued and dispatch started",
      dispatchedInitial: result,
    });
  } catch (err: any) {
    console.error("[Campaign Send API] Error:", err);
    return NextResponse.json({ error: "Failed to dispatch campaign" }, { status: 500 });
  }
}
