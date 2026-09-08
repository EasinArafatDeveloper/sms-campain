import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { AudienceService } from "@/lib/services/audience.service";
import { CreateAudienceSegmentSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";

    const segments = await AudienceService.listSegments(orgId);
    return NextResponse.json(segments);
  } catch (err: any) {
    console.error("[Audience Segments API] Error:", err);
    return NextResponse.json({ error: "Failed to list audience segments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";
    const userId = session?.userId || "670000000000000000000002";

    const body = await req.json();
    const validated = CreateAudienceSegmentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const segment = await AudienceService.createSegment(orgId, userId, validated.data);
    return NextResponse.json({ success: true, segment }, { status: 201 });
  } catch (err: any) {
    console.error("[Audience Create API] Error:", err);
    return NextResponse.json({ error: "Failed to create audience segment" }, { status: 500 });
  }
}
