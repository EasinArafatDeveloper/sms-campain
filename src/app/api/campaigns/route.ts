import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { CampaignService } from "@/lib/services/campaign.service";
import { CreateCampaignSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001"; // Fallback demo org

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";

    const result = await CampaignService.listCampaigns(orgId, { page, limit, status, search });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Campaigns API] List error:", err);
    return NextResponse.json({ error: "Failed to list campaigns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";
    const userId = session?.userId || "670000000000000000000002";

    const body = await req.json();
    const validated = CreateCampaignSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
    const requestOrigin = host ? `${proto}://${host}` : undefined;

    const campaign = await CampaignService.createCampaign(
      orgId,
      userId,
      validated.data as any,
      { baseUrl: requestOrigin ? `${requestOrigin}/t` : undefined }
    );
    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (err: any) {
    console.error("[Campaigns API] Create error:", err);
    return NextResponse.json({ error: err.message || "Failed to create campaign" }, { status: 500 });
  }
}
