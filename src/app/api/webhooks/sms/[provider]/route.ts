import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import {
  DeliveryJobModel,
  CampaignRecipientModel,
  CampaignModel,
  DeliveryEventModel,
} from "@/lib/db/models";
import { getSmsProviderForOrg } from "@/lib/providers";
import { env } from "@/lib/env";
import crypto from "crypto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  try {
    const { provider } = await params;

    // Verify webhook authorization token - fail-closed (503 if not configured on server)
    const webhookSecret = env.WEBHOOK_SECRET || process.env.WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret.trim().length === 0) {
      return NextResponse.json(
        { error: "Service Unavailable", message: "Webhook secret is not configured on the server." },
        { status: 503 }
      );
    }

    const incomingRaw = (
      req.headers.get("x-webhook-secret") ||
      req.headers.get("authorization") ||
      req.nextUrl.searchParams.get("token") ||
      ""
    ).trim();
    const incoming = incomingRaw.replace(/^Bearer\s+/i, "");

    const incomingBuffer = Buffer.from(incoming, "utf-8");
    const secretBuffer = Buffer.from(webhookSecret.trim(), "utf-8");

    const isAuthorized =
      incomingBuffer.length === secretBuffer.length &&
      crypto.timingSafeEqual(incomingBuffer, secretBuffer);

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized webhook caller" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    await connectToDatabase();
    const smsProvider = await getSmsProviderForOrg();
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    const parsed = smsProvider.parseWebhook(body, headers);

    if (!parsed || !parsed.providerMessageId) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const job = await DeliveryJobModel.findOne({ providerMessageId: parsed.providerMessageId });
    if (!job) {
      return NextResponse.json({ message: "Job not found, recorded raw event", received: true });
    }

    const previousStatus = job.status;
    job.status = parsed.event;
    await job.save();

    // Update campaign recipient
    await CampaignRecipientModel.updateOne(
      {
        campaignId: job.campaignId,
        recipientId: job.recipientId,
      },
      {
        $set: {
          deliveryStatus: parsed.event,
          ...(parsed.event === "delivered" ? { deliveredAt: new Date() } : {}),
        },
      }
    );

    // Idempotently update campaign stats
    if (previousStatus !== "delivered" && parsed.event === "delivered") {
      await CampaignModel.updateOne(
        { _id: job.campaignId },
        {
          $inc: { "statistics.delivered": 1 },
        }
      );
    } else if (previousStatus !== "failed" && parsed.event === "failed") {
      await CampaignModel.updateOne(
        { _id: job.campaignId },
        {
          $inc: { "statistics.failed": 1 },
        }
      );
    }

    // Record DeliveryEvent
    await DeliveryEventModel.create({
      organizationId: job.organizationId,
      campaignId: job.campaignId,
      recipientId: job.recipientId,
      trackingId: job.trackingId,
      provider,
      providerMessageId: parsed.providerMessageId,
      eventType: parsed.event,
      payload: body,
      occurredAt: parsed.occurredAt || new Date(),
    });

    return NextResponse.json({ success: true, event: parsed.event });
  } catch (err: any) {
    console.error("[Webhook API] Error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
