import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { AudienceService } from "@/lib/services/audience.service";
import { EngagementService } from "@/lib/services/engagement.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const segment = searchParams.get("segment") || "all";
    const search = searchParams.get("search") || "";

    const [leadsResult, optimization] = await Promise.all([
      AudienceService.listActiveLeads(orgId, { page, limit, segment, search }),
      EngagementService.getBudgetOptimizationSummary(orgId),
    ]);

    return NextResponse.json({
      leads: leadsResult.data,
      total: leadsResult.total,
      page: leadsResult.page,
      limit: leadsResult.limit,
      totalPages: leadsResult.totalPages,
      optimization,
    });
  } catch (err: any) {
    console.error("[Active Leads API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch active leads" }, { status: 500 });
  }
}
