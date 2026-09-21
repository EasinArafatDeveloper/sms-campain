import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/auth";
import { OrganizationModel, UserModel, AuditLogModel } from "@/lib/db/models";
import { connectToDatabase } from "@/lib/db/connect";
import Papa from "papaparse";

export const GET = withTenant(
  async (req: NextRequest) => {
    try {
      await connectToDatabase();
      const { searchParams } = new URL(req.url);
      const type = searchParams.get("type") || "tenants";

      let csvData = "";
      let filename = `export-${type}-${Date.now()}.csv`;

      if (type === "tenants") {
        const orgs = await OrganizationModel.find({}).sort({ createdAt: -1 }).lean();
        const orgIds = orgs.map((o) => o._id);

        const owners = await UserModel.find({
          defaultOrganizationId: { $in: orgIds },
          role: "owner",
        })
          .select("name email phone defaultOrganizationId")
          .lean();

        const ownerMap = new Map<string, any>();
        owners.forEach((u) => {
          if (u.defaultOrganizationId) {
            ownerMap.set(u.defaultOrganizationId.toString(), u);
          }
        });

        const rows = orgs.map((org: any) => {
          const owner = ownerMap.get(org._id.toString());
          return {
            "Workspace ID": org._id.toString(),
            "Workspace Name": org.name,
            Slug: org.slug,
            Plan: org.plan || "starter",
            Status: org.status || "active",
            "SMS Credits": org.smsCredits ?? 0,
            "Default Sender ID": org.defaultSenderId || "",
            "Owner Name": owner?.name || "N/A",
            "Owner Email": owner?.email || "N/A",
            "Owner Phone": owner?.phone || "N/A",
            "Created Date": org.createdAt ? new Date(org.createdAt).toISOString() : "",
          };
        });

        csvData = Papa.unparse(rows);
        filename = `smspro-tenants-${new Date().toISOString().slice(0, 10)}.csv`;
      } else if (type === "users") {
        const users = await UserModel.find({})
          .populate("defaultOrganizationId", "name slug")
          .sort({ createdAt: -1 })
          .select("-passwordHash")
          .lean();

        const rows = users.map((u: any) => ({
          "User ID": u._id.toString(),
          Name: u.name,
          Email: u.email,
          Phone: u.phone || "",
          "Phone Verified": u.isPhoneVerified ? "Yes" : "No",
          Role: u.role || "owner",
          "Platform Role": u.platformRole || "user",
          Status: u.status || "active",
          "Workspace Name": u.defaultOrganizationId?.name || "N/A",
          "Workspace Slug": u.defaultOrganizationId?.slug || "N/A",
          "Joined Date": u.createdAt ? new Date(u.createdAt).toISOString() : "",
        }));

        csvData = Papa.unparse(rows);
        filename = `smspro-users-${new Date().toISOString().slice(0, 10)}.csv`;
      } else if (type === "audit-logs") {
        const logs = await AuditLogModel.find({})
          .sort({ createdAt: -1 })
          .limit(1000)
          .populate("organizationId", "name")
          .populate("userId", "name email")
          .lean();

        const rows = logs.map((log: any) => ({
          "Log ID": log._id.toString(),
          Action: log.action,
          "Resource Type": log.resourceType,
          "Resource ID": log.resourceId || "",
          "Admin Name": log.userName || log.userId?.name || "System",
          "Admin Email": log.userId?.email || log.metadata?.adminEmail || "",
          "Organization Name": log.organizationId?.name || "Global / System",
          "Timestamp": log.createdAt ? new Date(log.createdAt).toISOString() : "",
          "Details / Metadata": JSON.stringify(log.metadata || {}),
        }));

        csvData = Papa.unparse(rows);
        filename = `smspro-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      } else {
        return NextResponse.json({ error: "Invalid export type. Allowed: tenants, users, audit-logs" }, { status: 400 });
      }

      return new NextResponse(csvData, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (err: any) {
      console.error("[Admin Export API] Error:", err);
      return NextResponse.json({ error: "Failed to generate CSV export" }, { status: 500 });
    }
  },
  { requireSuperAdmin: true }
);
