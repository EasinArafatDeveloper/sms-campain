import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { DeliveryService } from "@/lib/services/delivery.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const campaignId = searchParams.get("campaignId") || undefined;

    const [stats, jobsResult, health] = await Promise.all([
      DeliveryService.getQueueStats(orgId, campaignId),
      DeliveryService.listQueueJobs(orgId, { page, limit, status, search, campaignId }),
      DeliveryService.getApiHealth(orgId),
    ]);

    return NextResponse.json({
      stats,
      jobs: jobsResult.data,
      total: jobsResult.total,
      page: jobsResult.page,
      limit: jobsResult.limit,
      totalPages: jobsResult.totalPages,
      health,
    });
  } catch (err: any) {
    console.error("[Delivery Queue API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch delivery queue" }, { status: 500 });
  }
}
