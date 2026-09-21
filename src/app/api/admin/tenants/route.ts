import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import {
  OrganizationModel,
  UserModel,
  MembershipModel,
  CampaignModel,
  DeliveryJobModel,
  ClickEventModel,
  AuditLogModel,
} from "@/lib/db/models";
import { connectToDatabase } from "@/lib/db/connect";
import { escapeRegex } from "@/lib/security";
import mongoose from "mongoose";

export const GET = withTenant(
  async (req: NextRequest) => {
    try {
      await connectToDatabase();
      const { searchParams } = new URL(req.url);
      const search = (searchParams.get("search") || "").trim();
      const plan = searchParams.get("plan") || "all";
      const status = searchParams.get("status") || "all";
      const creditAlert = searchParams.get("creditAlert") || "all";
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (status !== "all") {
        filter.status = status;
      }
      if (plan !== "all") {
        filter.plan = plan;
      }
      if (creditAlert === "zero") {
        filter.smsCredits = { $lte: 0 };
      } else if (creditAlert === "low") {
        filter.smsCredits = { $gt: 0, $lte: 10 };
      }

      if (search) {
        const safe = escapeRegex(search);
        // Find matching owners first if searching by user email/name
        const matchingUsers = await UserModel.find({
          $or: [
            { name: { $regex: safe, $options: "i" } },
            { email: { $regex: safe, $options: "i" } },
          ],
        }).select("_id defaultOrganizationId").lean();

        const userOrgIds = matchingUsers
          .map((u) => u.defaultOrganizationId)
          .filter(Boolean);

        filter.$or = [
          { name: { $regex: safe, $options: "i" } },
          { slug: { $regex: safe, $options: "i" } },
          { _id: { $in: userOrgIds } },
        ];
      }

      const [organizations, total] = await Promise.all([
        OrganizationModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        OrganizationModel.countDocuments(filter),
      ]);

      const orgIds = organizations.map((o) => o._id);

      // Single-query parallel aggregations to prevent N+1 performance issues
      const [owners, memberships, campaignStats, deliveryStats, clickStats] = await Promise.all([
        UserModel.find({
          defaultOrganizationId: { $in: orgIds },
          role: "owner",
        })
          .select("name email phone isPhoneVerified defaultOrganizationId")
          .lean(),

        MembershipModel.aggregate([
          { $match: { organizationId: { $in: orgIds } } },
          { $group: { _id: "$organizationId", memberCount: { $sum: 1 } } },
        ]),

        CampaignModel.aggregate([
          { $match: { organizationId: { $in: orgIds } } },
          { $group: { _id: "$organizationId", campaignCount: { $sum: 1 }, latestCampaign: { $max: "$createdAt" } } },
        ]),

        DeliveryJobModel.aggregate([
          { $match: { organizationId: { $in: orgIds }, status: "sent" } },
          { $group: { _id: "$organizationId", smsSent: { $sum: 1 } } },
        ]),

        ClickEventModel.aggregate([
          { $match: { organizationId: { $in: orgIds }, isHumanVerified: true } },
          { $group: { _id: "$organizationId", totalClicks: { $sum: 1 } } },
        ]),
      ]);

      const ownerMap = new Map<string, any>();
      owners.forEach((u) => {
        if (u.defaultOrganizationId) {
          ownerMap.set(u.defaultOrganizationId.toString(), u);
        }
      });

      const memberMap = new Map<string, number>();
      memberships.forEach((m) => memberMap.set(m._id.toString(), m.memberCount));

      const campaignMap = new Map<string, { count: number; lastActivity?: string }>();
      campaignStats.forEach((c) =>
        campaignMap.set(c._id.toString(), {
          count: c.campaignCount,
          lastActivity: c.latestCampaign ? new Date(c.latestCampaign).toISOString() : undefined,
        })
      );

      const smsSentMap = new Map<string, number>();
      deliveryStats.forEach((d) => smsSentMap.set(d._id.toString(), d.smsSent));

      const clickMap = new Map<string, number>();
      clickStats.forEach((ck) => clickMap.set(ck._id.toString(), ck.totalClicks));

      const enrichedTenants = organizations.map((org: any) => {
        const idStr = org._id.toString();
        const owner = ownerMap.get(idStr) || null;
        const campInfo = campaignMap.get(idStr);

        return {
          _id: idStr,
          name: org.name,
          slug: org.slug,
          plan: org.plan || "starter",
          status: org.status || "active",
          smsCredits: org.smsCredits ?? 0,
          defaultSenderId: org.defaultSenderId || "8809612781020",
          trackingDomain: org.trackingDomain || "",
          createdAt: org.createdAt ? new Date(org.createdAt).toISOString() : new Date().toISOString(),
          owner: owner
            ? {
                _id: owner._id.toString(),
                name: owner.name,
                email: owner.email,
                phone: owner.phone || "N/A",
                isPhoneVerified: !!owner.isPhoneVerified,
              }
            : null,
          memberCount: Math.max(1, memberMap.get(idStr) || 1),
          campaignCount: campInfo?.count || 0,
          smsSent: smsSentMap.get(idStr) || 0,
          totalClicks: clickMap.get(idStr) || 0,
          lastActivityAt: campInfo?.lastActivity || (org.updatedAt ? new Date(org.updatedAt).toISOString() : undefined),
        };
      });

      return NextResponse.json({
        success: true,
        tenants: enrichedTenants,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err: any) {
      console.error("[Admin Tenants GET API] Error:", err);
      return NextResponse.json({ error: "Failed to fetch tenant workspaces" }, { status: 500 });
    }
  },
  { requireSuperAdmin: true }
);

export const PATCH = withTenant(
  async (req: NextRequest, ctx: TenantContext) => {
    try {
      await connectToDatabase();
      const body = await req.json();
      const { organizationId, status, plan, defaultSenderId, name } = body;

      if (!organizationId) {
        return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
      }

      const orgObjId = new mongoose.Types.ObjectId(organizationId);
      const org = await OrganizationModel.findById(orgObjId);
      if (!org) {
        return NextResponse.json({ error: "Organization workspace not found" }, { status: 404 });
      }

      const updateData: any = {};
      const changes: Record<string, { before: any; after: any }> = {};

      if (status && ["active", "suspended"].includes(status) && status !== org.status) {
        changes.status = { before: org.status, after: status };
        updateData.status = status;
      }

      if (plan && ["starter", "growth", "enterprise"].includes(plan) && plan !== org.plan) {
        changes.plan = { before: org.plan, after: plan };
        updateData.plan = plan;
      }

      if (typeof defaultSenderId === "string" && defaultSenderId.trim() && defaultSenderId !== org.defaultSenderId) {
        changes.defaultSenderId = { before: org.defaultSenderId, after: defaultSenderId.trim() };
        updateData.defaultSenderId = defaultSenderId.trim();
      }

      if (typeof name === "string" && name.trim().length >= 2 && name.trim() !== org.name) {
        changes.name = { before: org.name, after: name.trim() };
        updateData.name = name.trim();
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ success: true, message: "No changes detected", organization: org });
      }

      const updated = await OrganizationModel.findByIdAndUpdate(
        orgObjId,
        { $set: updateData },
        { new: true }
      ).lean();

      // Log SuperAdmin Audit Trail
      await AuditLogModel.create({
        organizationId: orgObjId,
        userId: new mongoose.Types.ObjectId(ctx.userId),
        userName: ctx.userName,
        action: "ADMIN_UPDATE_ORGANIZATION",
        resourceType: "Organization",
        resourceId: organizationId,
        metadata: {
          adminEmail: ctx.userEmail,
          organizationName: org.name,
          changes,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Organization workspace updated successfully",
        organization: updated,
      });
    } catch (err: any) {
      console.error("[Admin Tenants PATCH API] Error:", err);
      return NextResponse.json({ error: err.message || "Failed to update workspace" }, { status: 500 });
    }
  },
  { requireSuperAdmin: true }
);
