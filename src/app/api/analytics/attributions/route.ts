import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { AnalyticsService } from "@/lib/services/analytics.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const campaignId = searchParams.get("campaignId") || undefined;

    const result = await AnalyticsService.listUserAttributions(orgId, { page, limit, search, campaignId });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Attribution API] Error:", err);
    return NextResponse.json({ error: "Failed to list attributions" }, { status: 500 });
  }
}
