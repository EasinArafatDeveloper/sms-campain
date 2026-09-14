import { NextRequest, NextResponse } from "next/server";
import { TrackingService } from "@/lib/services/tracking.service";

// List of reserved system routes to never treat as tracking IDs
const RESERVED_ROUTES = new Set([
  "api",
  "dashboard",
  "campaigns",
  "link-generator",
  "delivery-queue",
  "click-analytics",
  "active-leads",
  "audiences",
  "reports",
  "settings",
  "login",
  "register",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;

    if (!slug || slug.length === 0) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    const firstSegment = slug[0].toLowerCase();
    if (RESERVED_ROUTES.has(firstSegment)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Determine the tracking identifiers
    const trackingIdCandidate = slug.length === 1 ? slug[0] : slug[slug.length - 1];
    const fullPathCandidate = slug.join("/");
    const hyphenCandidate = slug.join("-");

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;
    const referer = req.headers.get("referer") || undefined;
    const purpose =
      req.headers.get("purpose") ||
      req.headers.get("sec-purpose") ||
      req.headers.get("x-purpose") ||
      undefined;

    // 1. Try trackingIdCandidate (e.g. "eid-A8K7" or "A8K7")
    let result = await TrackingService.resolveAndTrackClick(trackingIdCandidate, {
      ip,
      userAgent,
      referer,
      purpose,
    });

    // 2. Fallback to hyphenated (e.g. "eid-A8K7")
    if (!result.destinationUrl && hyphenCandidate !== trackingIdCandidate) {
      result = await TrackingService.resolveAndTrackClick(hyphenCandidate, {
        ip,
        userAgent,
        referer,
        purpose,
      });
    }

    // 3. Fallback to full path (e.g. "eid/A8K7")
    if (!result.destinationUrl && fullPathCandidate !== trackingIdCandidate) {
      result = await TrackingService.resolveAndTrackClick(fullPathCandidate, {
        ip,
        userAgent,
        referer,
        purpose,
      });
    }

    if (!result.destinationUrl) {
      // Fallback redirect if tracking link expired or not found
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Fast 302 Found redirect to destination URL
    return NextResponse.redirect(new URL(result.destinationUrl), {
      status: 302,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (err: any) {
    console.error("[Tracking Engine] Catch-all redirect error:", err);
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
}
