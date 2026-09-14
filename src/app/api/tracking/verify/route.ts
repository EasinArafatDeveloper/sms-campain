import { NextRequest, NextResponse } from "next/server";
import { TrackingService } from "@/lib/services/tracking.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, trackingId, screenWidth, screenHeight, hasTouch, renderTimeMs } = body;

    if (!token && !trackingId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const result = await TrackingService.recordVerifiedHumanClick(
      token,
      trackingId,
      { screenWidth, screenHeight, hasTouch, renderTimeMs }
    );

    return NextResponse.json({ ok: true, verified: result.verified }, { status: 200 });
  } catch (err: any) {
    console.error("[Tracking Verification] Beacon error:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

