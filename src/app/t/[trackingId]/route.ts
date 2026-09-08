import { NextRequest, NextResponse } from "next/server";
import { TrackingService } from "@/lib/services/tracking.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ trackingId: string }> }) {
  try {
    const { trackingId } = await params;

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;
    const referer = req.headers.get("referer") || undefined;
    const purpose = req.headers.get("purpose") || req.headers.get("sec-purpose") || req.headers.get("x-purpose") || undefined;

    const result = await TrackingService.resolveAndTrackClick(trackingId, {
      ip,
      userAgent,
      referer,
      purpose,
    });

    if (!result.destinationUrl) {
      // Fallback redirect
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Fast 302 Found redirect to destination
    return NextResponse.redirect(new URL(result.destinationUrl), {
      status: 302,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (err: any) {
    console.error("[Tracking Engine] Redirect error:", err);
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
}
