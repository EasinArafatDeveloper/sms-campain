import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { DeliveryService } from "@/lib/services/delivery.service";

export const GET = withTenant(async (req: NextRequest, ctx: TenantContext) => {
  try {
    const health = await DeliveryService.getApiHealth(ctx.organizationId);
    return NextResponse.json(health);
  } catch (err: any) {
    console.error("[Delivery Health API] Error:", err);
    return NextResponse.json({ error: "Failed to get health metrics" }, { status: 500 });
  }
});
