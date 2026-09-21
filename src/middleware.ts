import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { BRAND } from "@/lib/brand";

const AUTH_SECRET = process.env.AUTH_SECRET || "";
const secretKey = new TextEncoder().encode(AUTH_SECRET);
const SESSION_COOKIE_NAME = `${BRAND.slug}_session`;

// Whitelisted public routes that don't require session
const PUBLIC_FILE_REGEX = /\.(.*)$/;

const PUBLIC_EXACT_ROUTES = new Set([
  "/",
  "/login",
  "/register",
  "/verify-phone",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/send-otp",
  "/api/auth/verify-otp",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/tracking/verify",
  "/api/health",
]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip static assets, favicon, Next.js internal chunks
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    PUBLIC_FILE_REGEX.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Allow public endpoints & webhooks
  if (PUBLIC_EXACT_ROUTES.has(pathname) || pathname.startsWith("/api/webhooks")) {
    return NextResponse.next();
  }

  // 3. Allow tracking short URLs (all single/multi segment non-app routes handled by [...slug])
  const APP_PAGE_PREFIXES = [
    "/dashboard",
    "/campaigns",
    "/delivery-queue",
    "/click-analytics",
    "/active-leads",
    "/audiences",
    "/reports",
    "/settings",
    "/link-generator",
    "/admin",
  ];

  const isAppPage = APP_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isApiRoute = pathname.startsWith("/api/");

  if (!isAppPage && !isApiRoute) {
    // This is a short tracking link redirect request, let Next.js route to [...slug]
    return NextResponse.next();
  }

  // 4. Verify Session Token
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  let isValidSession = false;
  let sessionPayload: any = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secretKey);
      sessionPayload = payload;
      isValidSession = !!payload.userId && !!payload.organizationId;
    } catch {
      isValidSession = false;
    }
  }

  // 5. Handle Unauthenticated Requests
  if (!isValidSession) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Valid authentication session required" },
        { status: 401 }
      );
    }

    // Redirect to login with callbackUrl
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 6. SuperAdmin Protection for /admin and /api/admin
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (sessionPayload?.platformRole !== "superadmin") {
      if (isApiRoute) {
        return NextResponse.json(
          { error: "Forbidden", message: "SuperAdmin privileges required" },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
