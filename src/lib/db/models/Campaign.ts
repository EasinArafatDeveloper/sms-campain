import mongoose, { Schema, Document, Model } from "mongoose";
import { CampaignStatus, TrackingFormat } from "@/types";

export interface ICampaignDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  senderId: string;
  message: string;
  status: CampaignStatus;
  audienceId?: mongoose.Types.ObjectId;
  audienceName?: string;
  recipientCount: number;
  trackingConfig: {
    destinationUrl: string;
    format: TrackingFormat;
    length: number;
  };
  statistics: {
    totalRecipients: number;
    linksGenerated: number;
    queued: number;
    processing: number;
    sent: number;
    delivered: number;
    failed: number;
    pendingRetry: number;
    totalClicks: number;
    uniqueClickers: number;
    repeatClickers: number;
    highIntentLeads: number;
    deliveryRate: number;
    clickRate: number;
  };
  scheduledAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaignDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { type: String, required: true, trim: true },
    senderId: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "scheduled", "generating_links", "queued", "sending", "completed", "paused", "failed", "cancelled"],
      default: "draft",
      index: true,
    },
    audienceId: { type: Schema.Types.ObjectId, ref: "AudienceSegment" },
    audienceName: { type: String },
    recipientCount: { type: Number, default: 0 },
    trackingConfig: {
      destinationUrl: { type: String, default: "https://mybrand.com/offer" },
      format: { type: String, enum: ["numeric", "alphanumeric"], default: "numeric" },
      length: { type: Number, default: 6 },
    },
    statistics: {
      totalRecipients: { type: Number, default: 0 },
      linksGenerated: { type: Number, default: 0 },
      queued: { type: Number, default: 0 },
      processing: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      pendingRetry: { type: Number, default: 0 },
      totalClicks: { type: Number, default: 0 },
      uniqueClickers: { type: Number, default: 0 },
      repeatClickers: { type: Number, default: 0 },
      highIntentLeads: { type: Number, default: 0 },
      deliveryRate: { type: Number, default: 0 },
      clickRate: { type: Number, default: 0 },
    },
    scheduledAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

CampaignSchema.index({ organizationId: 1, createdAt: -1 });
CampaignSchema.index({ organizationId: 1, status: 1 });

export const CampaignModel: Model<ICampaignDocument> =
  mongoose.models.Campaign || mongoose.model<ICampaignDocument>("Campaign", CampaignSchema);
