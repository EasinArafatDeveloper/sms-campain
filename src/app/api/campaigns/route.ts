import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { CampaignService } from "@/lib/services/campaign.service";
import { CreateCampaignSchema } from "@/lib/validations";

export const GET = withTenant(async (req: NextRequest, ctx: TenantContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";

    const result = await CampaignService.listCampaigns(ctx.organizationId, { page, limit, status, search });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Campaigns API] List error:", err);
    return NextResponse.json({ error: "Failed to list campaigns" }, { status: 500 });
  }
});

export const POST = withTenant(async (req: NextRequest, ctx: TenantContext) => {
  try {
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
      ctx.organizationId,
      ctx.userId,
      validated.data as any,
      { baseUrl: requestOrigin ? `${requestOrigin}/t` : undefined }
    );
    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (err: any) {
    console.error("[Campaigns API] Create error:", err);
    return NextResponse.json({ error: err.message || "Failed to create campaign" }, { status: 500 });
  }
});
