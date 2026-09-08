import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { AnalyticsService } from "@/lib/services/analytics.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";

    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId") || undefined;

    const data = await AnalyticsService.getClickAnalyticsMetrics(orgId, campaignId);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[Analytics API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch analytics metrics" }, { status: 500 });
  }
}
