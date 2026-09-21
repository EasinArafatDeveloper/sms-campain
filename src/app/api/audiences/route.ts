import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { AudienceService } from "@/lib/services/audience.service";
import { CreateAudienceSegmentSchema } from "@/lib/validations";

export const GET = withTenant(async (req: NextRequest, ctx: TenantContext) => {
  try {
    const segments = await AudienceService.listSegments(ctx.organizationId);
    return NextResponse.json(segments);
  } catch (err: any) {
    console.error("[Audience Segments API] Error:", err);
    return NextResponse.json({ error: "Failed to list audience segments" }, { status: 500 });
  }
});

export const POST = withTenant(async (req: NextRequest, ctx: TenantContext) => {
  try {
    const body = await req.json();
    const validated = CreateAudienceSegmentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const segment = await AudienceService.createSegment(ctx.organizationId, ctx.userId, validated.data);
    return NextResponse.json({ success: true, segment }, { status: 201 });
  } catch (err: any) {
    console.error("[Audience Create API] Error:", err);
    return NextResponse.json({ error: "Failed to create audience segment" }, { status: 500 });
  }
});
