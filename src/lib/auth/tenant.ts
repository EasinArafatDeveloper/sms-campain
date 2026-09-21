import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./session";
import { PlatformRole, UserRole } from "@/types";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel, OrganizationModel } from "@/lib/db/models";

export interface TenantContext<T = any> {
  organizationId: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: UserRole;
  platformRole: PlatformRole;
  isPhoneVerified: boolean;
  params: T;
}

export interface WithTenantOptions {
  requireSuperAdmin?: boolean;
  requiredRoles?: UserRole[];
  requirePhoneVerified?: boolean;
}

export type TenantHandler<T = any> = (
  req: NextRequest,
  ctx: TenantContext<T>
) => Promise<Response> | Response;

/**
 * Higher-order API route wrapper that strictly enforces authentication, tenant context,
 * live DB status checks (disabled users / suspended orgs / revoked superadmins),
 * and role-based permissions across all SaaS endpoints.
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

      await connectToDatabase();

      // Live database verification for instant token revocation & status check
      const [user, org] = await Promise.all([
        UserModel.findById(session.userId).select("status platformRole role isPhoneVerified").lean(),
        OrganizationModel.findById(session.organizationId).select("status smsCredits").lean(),
      ]);

      if (!user || user.status === "disabled") {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "Your account is disabled or deactivated. Access denied.",
          },
          { status: 403 }
        );
      }

      if (!org || org.status === "suspended") {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "Your organization workspace has been suspended. Please contact support.",
          },
          { status: 403 }
        );
      }

      // Check SuperAdmin platform privilege against live DB
      if (options.requireSuperAdmin && user.platformRole !== "superadmin") {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "SuperAdmin platform privileges are required",
          },
          { status: 403 }
        );
      }

      // Check Role-Based Access Control (RBAC)
      const effectiveRole = (user.role as UserRole) || (session.role as UserRole) || "owner";
      if (options.requiredRoles && options.requiredRoles.length > 0) {
        if (!options.requiredRoles.includes(effectiveRole) && user.platformRole !== "superadmin") {
          return NextResponse.json(
            {
              error: "Forbidden",
              message: `Insufficient permissions. Required role: ${options.requiredRoles.join(", ")}`,
            },
            { status: 403 }
          );
        }
      }

      // Check Phone Verification guard if requested
      if (options.requirePhoneVerified && !user.isPhoneVerified && user.platformRole !== "superadmin") {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "Phone verification is required before performing this action. Please verify your phone number.",
            code: "PHONE_NOT_VERIFIED",
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
        role: effectiveRole,
        platformRole: (user.platformRole as PlatformRole) || (session.platformRole as PlatformRole) || "user",
        isPhoneVerified: !!user.isPhoneVerified,
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
