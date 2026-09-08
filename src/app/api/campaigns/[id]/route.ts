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
