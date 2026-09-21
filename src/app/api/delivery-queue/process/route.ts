import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { DeliveryService } from "@/lib/services/delivery.service";

export const POST = withTenant(async (req: NextRequest, ctx: TenantContext) => {
  try {
    const orgId = ctx.organizationId;
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(body.limit || 50, 100);
    const campaignId = body.campaignId || undefined;

    const result = await DeliveryService.processBatch(orgId, limit, campaignId);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("[Delivery Process API] Error:", err);
    return NextResponse.json({ error: "Batch processing failed" }, { status: 500 });
  }
});
