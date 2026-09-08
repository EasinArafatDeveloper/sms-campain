import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import {
  AudienceSegmentModel,
  EngagementProfileModel,
  RecipientModel,
  AuditLogModel,
} from "@/lib/db/models";
import { IAudienceSegment, PaginatedResult } from "@/types";

export class AudienceService {
  /**
   * Retrieves all audience segments for the organization.
   */
  static async listSegments(organizationId: string): Promise<IAudienceSegment[]> {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const segments = await AudienceSegmentModel.find({ organizationId: orgObjId })
      .sort({ createdAt: -1 })
      .lean();

    return segments as unknown as IAudienceSegment[];
  }

  /**
   * Creates a new audience segment with custom rules.
   */
  static async createSegment(
    organizationId: string,
    userId: string,
    data: { name: string; description?: string; rules: any[] }
  ): Promise<IAudienceSegment> {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Calculate estimated count based on rules
    const estimatedCount = await this.evaluateSegmentCount(organizationId, data.rules);

    const segment = await AudienceSegmentModel.create({
      organizationId: orgObjId,
      name: data.name.trim(),
      description: data.description,
      rules: data.rules,
      estimatedCount,
      createdBy: userObjId,
    });

    await AuditLogModel.create({
      organizationId: orgObjId,
      userId: userObjId,
      action: "AUDIENCE_SEGMENT_CREATED",
      resourceType: "audience_segment",
      resourceId: segment._id.toString(),
      metadata: { name: segment.name, estimatedCount },
    });

    return segment.toObject() as unknown as IAudienceSegment;
  }

  /**
   * Evaluates rules against the EngagementProfile collection to determine matching recipient count.
   */
  static async evaluateSegmentCount(organizationId: string, rules: any[]): Promise<number> {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const matchQuery: any = { organizationId: orgObjId };

    for (const rule of rules) {
      if (rule.field === "campaignsClicked") {
        if (rule.operator === "gte") matchQuery.campaignsClicked = { $gte: Number(rule.value) };
        else if (rule.operator === "lte") matchQuery.campaignsClicked = { $lte: Number(rule.value) };
        else if (rule.operator === "eq") matchQuery.campaignsClicked = Number(rule.value);
      } else if (rule.field === "totalClicks") {
        if (rule.operator === "gte") matchQuery.totalClicks = { $gte: Number(rule.value) };
        else if (rule.operator === "lte") matchQuery.totalClicks = { $lte: Number(rule.value) };
        else if (rule.operator === "eq") matchQuery.totalClicks = Number(rule.value);
      } else if (rule.field === "leadStatus") {
        matchQuery.leadStatus = rule.value;
      } else if (rule.field === "lastClickWithinDays") {
        const days = Number(rule.value);
        const thresholdDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        matchQuery.lastClickAt = { $gte: thresholdDate };
      }
    }

    const count = await EngagementProfileModel.countDocuments(matchQuery);
    return count;
  }

  /**
   * Retrieves active leads table matching the high-intent criteria.
   */
  static async listActiveLeads(
    organizationId: string,
    options: {
      page?: number;
      limit?: number;
      segment?: string;
      search?: string;
    } = {}
  ): Promise<PaginatedResult<any>> {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    const query: any = { organizationId: orgObjId };

    if (options.segment && options.segment !== "all") {
      query.leadStatus = options.segment;
    }

    if (options.search) {
      query.$or = [
        { phone: { $regex: options.search, $options: "i" } },
        { recipientName: { $regex: options.search, $options: "i" } },
      ];
    }

    const [leads, total] = await Promise.all([
      EngagementProfileModel.find(query)
        .sort({ engagementScore: -1, lastClickAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("recipientId", "customId")
        .lean(),
      EngagementProfileModel.countDocuments(query),
    ]);

    const formattedLeads = leads.map((lead: any) => {
      const isHighlyActive = lead.leadStatus === "highly_active";
      const customId = lead.recipientId?.customId || `USR-${lead.phone ? lead.phone.slice(-4) : "0000"}`;
      return {
        _id: lead._id,
        userId: customId,
        recipientId: lead.recipientId?._id || lead.recipientId,
        phone: lead.phone,
        recipientName: lead.recipientName || "Subscriber",
        campaignsClicked: lead.campaignsClicked || 0,
        totalClicks: lead.totalClicks || 0,
        lastClickAt: lead.lastClickAt || new Date(),
        engagementScore: lead.engagementScore || 0,
        leadStatus: lead.leadStatus,
        segmentName: isHighlyActive ? "Highly Active" : lead.leadStatus === "engaged" ? "Engaged" : "Low Engagement",
        recommendedAction: isHighlyActive ? "Retarget" : "Nurture",
      };
    });

    return {
      data: formattedLeads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
