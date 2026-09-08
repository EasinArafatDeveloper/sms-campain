import mongoose, { Schema, Document, Model } from "mongoose";
import { DeliveryStatus, ClickStatus } from "@/types";

export interface ICampaignRecipientDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  phone: string;
  recipientName?: string;
  trackingLinkId?: mongoose.Types.ObjectId;
  trackingId?: string;
  trackingUrl?: string;
  personalizedMessage: string;
  deliveryStatus: DeliveryStatus;
  clickStatus: ClickStatus;
  clickCount: number;
  firstClickedAt?: Date;
  lastClickedAt?: Date;
  providerMessageId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignRecipientSchema = new Schema<ICampaignRecipientDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "Recipient", required: true, index: true },
    phone: { type: String, required: true },
    recipientName: { type: String },
    trackingLinkId: { type: Schema.Types.ObjectId, ref: "TrackingLink" },
    trackingId: { type: String, index: true },
    trackingUrl: { type: String },
    personalizedMessage: { type: String, required: true },
    deliveryStatus: {
      type: String,
      enum: ["queued", "processing", "sent", "delivered", "failed", "retrying", "pending_retry"],
      default: "queued",
      index: true,
    },
    clickStatus: {
      type: String,
      enum: ["clicked", "not_clicked"],
      default: "not_clicked",
      index: true,
    },
    clickCount: { type: Number, default: 0 },
    firstClickedAt: { type: Date },
    lastClickedAt: { type: Date },
    providerMessageId: { type: String, index: true },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

CampaignRecipientSchema.index({ organizationId: 1, campaignId: 1, recipientId: 1 }, { unique: true });
CampaignRecipientSchema.index({ organizationId: 1, campaignId: 1, deliveryStatus: 1 });
CampaignRecipientSchema.index({ organizationId: 1, campaignId: 1, clickStatus: 1 });
CampaignRecipientSchema.index({ organizationId: 1, trackingId: 1 });

export const CampaignRecipientModel: Model<ICampaignRecipientDocument> =
  mongoose.models.CampaignRecipient ||
  mongoose.model<ICampaignRecipientDocument>("CampaignRecipient", CampaignRecipientSchema);
