import mongoose, { Schema, Document, Model } from "mongoose";
import { LeadStatus } from "@/types";

export interface IEngagementProfileDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  phone: string;
  recipientName?: string;
  campaignsReceived: number;
  campaignsClicked: number;
  campaignIdsClicked: mongoose.Types.ObjectId[];
  totalClicks: number;
  firstClickAt?: Date;
  lastClickAt?: Date;
  engagementScore: number;
  leadStatus: LeadStatus;
  updatedAt: Date;
}

const EngagementProfileSchema = new Schema<IEngagementProfileDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "Recipient", required: true, index: true },
    phone: { type: String, required: true },
    recipientName: { type: String },
    campaignsReceived: { type: Number, default: 0 },
    campaignsClicked: { type: Number, default: 0 },
    campaignIdsClicked: [{ type: Schema.Types.ObjectId, ref: "Campaign" }],
    totalClicks: { type: Number, default: 0 },
    firstClickAt: { type: Date },
    lastClickAt: { type: Date, index: true },
    engagementScore: { type: Number, default: 0, index: true },
    leadStatus: {
      type: String,
      enum: ["highly_active", "engaged", "low_engagement", "inactive"],
      default: "inactive",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

EngagementProfileSchema.index({ organizationId: 1, recipientId: 1 }, { unique: true });
EngagementProfileSchema.index({ organizationId: 1, leadStatus: 1, engagementScore: -1 });

export const EngagementProfileModel: Model<IEngagementProfileDocument> =
  mongoose.models.EngagementProfile ||
  mongoose.model<IEngagementProfileDocument>("EngagementProfile", EngagementProfileSchema);
