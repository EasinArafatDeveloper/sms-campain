import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { UserModel, OrganizationModel, CampaignModel, DeliveryJobModel } from "@/lib/db/models";
import { connectToDatabase } from "@/lib/db/connect";
import { escapeRegex } from "@/lib/security";

export const GET = withTenant(
  async (req: NextRequest) => {
    try {
      await connectToDatabase();
      const { searchParams } = new URL(req.url);
      const search = searchParams.get("search") || "";
      const page = parseInt(searchParams.get("page") || "1", 10);
      const limit = parseInt(searchParams.get("limit") || "20", 10);
      const skip = (page - 1) * limit;

      const query: any = {};
      if (search) {
        const safe = escapeRegex(search);
        query.$or = [
          { name: { $regex: safe, $options: "i" } },
          { email: { $regex: safe, $options: "i" } },
          { phone: { $regex: safe, $options: "i" } },
        ];
      }

      const [users, total] = await Promise.all([
        UserModel.find(query)
          .select("-passwordHash")
          .populate("defaultOrganizationId")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        UserModel.countDocuments(query),
      ]);

      // Enrich users with tenant stats
      const enriched = await Promise.all(
        users.map(async (u: any) => {
          const org = u.defaultOrganizationId;
          let campaignCount = 0;
          let smsSent = 0;

          if (org?._id) {
            campaignCount = await CampaignModel.countDocuments({ organizationId: org._id });
            smsSent = await DeliveryJobModel.countDocuments({ organizationId: org._id, status: "sent" });
          }

          return {
            _id: u._id,
            name: u.name,
            email: u.email,
            phone: u.phone || "N/A",
            isPhoneVerified: !!u.isPhoneVerified,
            role: u.role,
            platformRole: u.platformRole || "user",
            status: u.status,
            createdAt: u.createdAt,
            organization: org
              ? {
                  _id: org._id,
                  name: org.name,
                  slug: org.slug,
                  smsCredits: org.smsCredits ?? 20,
                  status: org.status,
                }
              : null,
            stats: {
              campaignCount,
              smsSent,
            },
          };
        })
      );

      return NextResponse.json({
        users: enriched,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err: any) {
      console.error("[Admin Users API] Error:", err);
      return NextResponse.json({ error: "Failed to fetch admin users" }, { status: 500 });
    }
  },
  { requireSuperAdmin: true }
);

export const PATCH = withTenant(
  async (req: NextRequest) => {
    try {
      await connectToDatabase();
      const body = await req.json();
      const { userId, status, platformRole } = body;

      if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
      }

      const updateData: any = {};
      if (status && ["active", "disabled"].includes(status)) {
        updateData.status = status;
      }
      if (platformRole && ["user", "superadmin"].includes(platformRole)) {
        updateData.platformRole = platformRole;
      }

      const user = await UserModel.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).select(
        "-passwordHash"
      );

      // If user disabled, also suspend their default organization
      if (status && user?.defaultOrganizationId) {
        await OrganizationModel.findByIdAndUpdate(user.defaultOrganizationId, {
          status: status === "active" ? "active" : "suspended",
        });
      }

      return NextResponse.json({ success: true, user });
    } catch (err: any) {
      console.error("[Admin Users Update API] Error:", err);
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
  },
  { requireSuperAdmin: true }
);
