import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { CampaignService } from "@/lib/services/campaign.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";

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

