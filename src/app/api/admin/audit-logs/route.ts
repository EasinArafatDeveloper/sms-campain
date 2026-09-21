import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/auth";
import { AuditLogModel } from "@/lib/db/models";
import { connectToDatabase } from "@/lib/db/connect";

export const GET = withTenant(
  async (req: NextRequest) => {
    try {
      await connectToDatabase();
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get("limit") || "30", 10);

      const logs = await AuditLogModel.find({})
        .sort({ createdAt: -1 })
        .limit(Math.min(limit, 100))
        .populate("organizationId", "name slug")
        .populate("userId", "name email")
        .lean();

      return NextResponse.json({
        success: true,
        logs: logs.map((log: any) => ({
          _id: log._id,
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          userName: log.userName || log.userId?.name || "System",
          userEmail: log.userId?.email || log.metadata?.adminEmail || "",
          organizationName: log.organizationId?.name || "Global / System",
          metadata: log.metadata || {},
          createdAt: log.createdAt,
        })),
      });
    } catch (err: any) {
      console.error("[Admin Audit Logs API] Error:", err);
      return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
    }
  },
  { requireSuperAdmin: true }
);
