import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { CampaignService } from "@/lib/services/campaign.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";

    const { searchParams } = new URL(req.url);
    const isDetailed = searchParams.get("detailed") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const filter = (searchParams.get("filter") as any) || undefined;

    if (isDetailed || searchParams.has("page") || searchParams.has("search") || searchParams.has("filter")) {
      const detailedReport = await CampaignService.getCampaignDetailedReport(orgId, id, {
        page,
        limit,
        search,
        status,
        filter,
      });

      if (!detailedReport) {
        return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
      }

      return NextResponse.json(detailedReport);
    }

    const campaign = await CampaignService.getCampaignById(orgId, id);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (err: any) {
    console.error("[Campaign API] Get error:", err);
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";
    const userId = session?.userId;

    const result = await CampaignService.deleteCampaign(orgId, id, userId);
    if (!result.success) {
      return NextResponse.json({ error: "Campaign not found or already deleted" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Campaign and all associated delivery records, tracking links, and click events deleted successfully.",
      deletedCounts: result.deletedCounts,
    });
  } catch (err: any) {
    console.error("[Campaign API] Delete error:", err);
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}

