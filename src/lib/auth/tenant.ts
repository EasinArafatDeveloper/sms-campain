import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./session";
import { PlatformRole, UserRole } from "@/types";

export interface TenantContext<T = any> {
  organizationId: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: UserRole;
  platformRole?: PlatformRole;
  params: T;
}

export interface WithTenantOptions {
  requireSuperAdmin?: boolean;
}

export type TenantHandler<T = any> = (
  req: NextRequest,
  ctx: TenantContext<T>
) => Promise<Response> | Response;

/**
 * Higher-order API route wrapper that strictly enforces authentication, tenant context,
 * and role-based permissions across all SaaS endpoints. Eliminates unauthenticated demo fallbacks.
 */
export function withTenant<T = any>(
  handler: TenantHandler<T>,
  options: WithTenantOptions = {}
) {
  return async function (
    req: NextRequest,
    context: { params: Promise<T> }
  ): Promise<Response> {
    try {
      const session = await getSession();

      if (!session || !session.userId || !session.organizationId) {
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: "Authentication session is required to access this resource",
          },
          { status: 401 }
        );
      }

      if (options.requireSuperAdmin && session.platformRole !== "superadmin") {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "SuperAdmin platform privileges are required",
          },
          { status: 403 }
        );
      }

      const resolvedParams = context?.params ? await context.params : ({} as T);

      const ctx: TenantContext<T> = {
        organizationId: session.organizationId,
        userId: session.userId,
        userEmail: session.email,
        userName: session.name,
        role: (session.role as UserRole) || "owner",
        platformRole: (session.platformRole as PlatformRole) || "user",
        params: resolvedParams,
      };

      return await handler(req, ctx);
    } catch (err: any) {
      console.error("[Tenant Guard] Error:", err);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: err.message || "An unexpected error occurred",
        },
        { status: 500 }
      );
    }
  };
}
