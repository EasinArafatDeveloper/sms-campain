import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { AnalyticsService } from "@/lib/services/analytics.service";

export const GET = withTenant(async (req: NextRequest, ctx: TenantContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId") || undefined;

    const data = await AnalyticsService.getClickAnalyticsMetrics(ctx.organizationId, campaignId);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[Analytics API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch analytics metrics" }, { status: 500 });
  }
});
