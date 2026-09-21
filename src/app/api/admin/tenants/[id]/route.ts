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
  ApiCredentialModel,
} from "@/lib/db/models";
import { connectToDatabase } from "@/lib/db/connect";
import mongoose from "mongoose";

export const GET = withTenant(
  async (req: NextRequest, ctx: TenantContext) => {
    try {
      await connectToDatabase();
      const orgId = ctx.params.id;

      if (!mongoose.isValidObjectId(orgId)) {
        return NextResponse.json({ error: "Invalid organization ID" }, { status: 400 });
      }

      const orgObjId = new mongoose.Types.ObjectId(orgId);

      const [org, cred, memberships, campaigns, auditLogs, smsSentCount, clickCount] = await Promise.all([
        OrganizationModel.findById(orgObjId).lean(),
        ApiCredentialModel.findOne({ organizationId: orgObjId, isDefault: true }).lean(),
        MembershipModel.find({ organizationId: orgObjId }).lean(),
        CampaignModel.find({ organizationId: orgObjId }).sort({ createdAt: -1 }).limit(15).lean(),
        AuditLogModel.find({
          organizationId: orgObjId,
          action: { $in: ["CREDITS_ADD", "CREDITS_DEDUCT", "CREDITS_SET", "ADMIN_UPDATE_ORGANIZATION"] },
        })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean(),
        DeliveryJobModel.countDocuments({ organizationId: orgObjId, status: "sent" }),
        ClickEventModel.countDocuments({ organizationId: orgObjId, isHumanVerified: true }),
      ]);

      if (!org) {
        return NextResponse.json({ error: "Organization workspace not found" }, { status: 404 });
      }

      // Fetch member users
      const memberUserIds = memberships.map((m) => m.userId);
      const memberUsers = await UserModel.find({
        $or: [{ defaultOrganizationId: orgObjId }, { _id: { $in: memberUserIds } }],
      })
        .select("-passwordHash")
        .lean();

      const memberRoleMap = new Map<string, string>();
      memberships.forEach((m) => memberRoleMap.set(m.userId.toString(), m.role));

      const ownerUser = memberUsers.find((u) => u.role === "owner") || memberUsers[0] || null;

      const formattedMembers = memberUsers.map((u: any) => ({
        _id: u._id.toString(),
        userId: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone || "N/A",
        isPhoneVerified: !!u.isPhoneVerified,
        role: memberRoleMap.get(u._id.toString()) || u.role || "member",
        status: u.status || "active",
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
      }));

      const formattedCampaigns = campaigns.map((c: any) => ({
        _id: c._id.toString(),
        name: c.name,
        status: c.status,
        totalRecipients: c.totalRecipients || 0,
        sent: c.statistics?.sent || 0,
        delivered: c.statistics?.delivered || 0,
        clicks: c.statistics?.clicks || 0,
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      }));

      const formattedCreditHistory = auditLogs.map((log: any) => ({
        _id: log._id.toString(),
        action: log.action,
        amount: log.metadata?.amount || 0,
        previousCredits: log.metadata?.previousCredits ?? 0,
        newCredits: log.metadata?.newCredits ?? 0,
        reason: log.metadata?.reason || "Admin Adjustment",
        paymentRef: log.metadata?.paymentRef || log.metadata?.transactionId || "",
        adminEmail: log.metadata?.adminEmail || "",
        createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
      }));

      const tenantDetail = {
        _id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        plan: org.plan || "starter",
        status: org.status || "active",
        smsCredits: org.smsCredits ?? 0,
        defaultSenderId: org.defaultSenderId || "8809612781020",
        trackingDomain: org.trackingDomain || "",
        senderIds: org.senderIds || [org.defaultSenderId || "8809612781020"],
        settings: {
          defaultTrackingLength: org.settings?.defaultTrackingLength ?? 4,
          defaultTrackingFormat: org.settings?.defaultTrackingFormat ?? "numeric",
          retentionDays: org.settings?.retentionDays ?? 90,
          enableWebhooks: !!org.settings?.enableWebhooks,
        },
        createdAt: org.createdAt ? new Date(org.createdAt).toISOString() : new Date().toISOString(),
        owner: ownerUser
          ? {
              _id: ownerUser._id.toString(),
              name: ownerUser.name,
              email: ownerUser.email,
              phone: ownerUser.phone || "N/A",
              isPhoneVerified: !!ownerUser.isPhoneVerified,
            }
          : null,
        memberCount: Math.max(1, formattedMembers.length),
        campaignCount: campaigns.length,
        smsSent: smsSentCount,
        totalClicks: clickCount,
        members: formattedMembers,
        recentCampaigns: formattedCampaigns,
        creditHistory: formattedCreditHistory,
        hasCustomApiKey: !!(cred?.apiKey && cred.apiKey.trim().length > 0),
        customSenderId: cred?.senderId,
      };

      return NextResponse.json({ success: true, tenant: tenantDetail });
    } catch (err: any) {
      console.error("[Admin Tenant Detail API] Error:", err);
      return NextResponse.json({ error: "Failed to fetch workspace details" }, { status: 500 });
    }
  },
  { requireSuperAdmin: true }
);
