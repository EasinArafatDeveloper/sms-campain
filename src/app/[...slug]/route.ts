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
    const purpose = req.headers.get("purpose") || undefined;
    const secPurpose = req.headers.get("sec-purpose") || req.headers.get("x-purpose") || undefined;
    const secFetchDest = req.headers.get("sec-fetch-dest") || undefined;
    const secFetchMode = req.headers.get("sec-fetch-mode") || undefined;
    const accept = req.headers.get("accept") || undefined;
    const acceptLanguage = req.headers.get("accept-language") || undefined;

    const requestMeta = {
      ip,
      userAgent,
      referer,
      purpose,
      secPurpose,
      secFetchDest,
      secFetchMode,
      accept,
      acceptLanguage,
    };

    // One indexed lookup for every possible spelling of the link (eid-a8k7, a8k7, eid/a8k7)
    const result = await TrackingService.resolveAndTrackClick(trackingIdCandidate, requestMeta, [
      trackingIdCandidate,
      hyphenCandidate,
      fullPathCandidate,
    ]);

    if (!result.destinationUrl) {
      // Fallback redirect if tracking link expired or not found
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // If candidate real human browser, serve ultra-fast Trampoline page with JS touchpoint beacon
    if (!result.isBot && result.trampolineHtml) {
      return new NextResponse(result.trampolineHtml, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      });
    }

    // For automated crawlers/preview bots, return fast 302 Found redirect
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
