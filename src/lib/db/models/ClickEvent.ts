import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClickEventDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  trackingId: string;
  destinationUrl: string;
  clickedAt: Date;
  ipHash?: string;
  userAgent?: string;
  referer?: string;
  metadata?: Record<string, unknown>;
}

const ClickEventSchema = new Schema<IClickEventDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "Recipient", required: true, index: true },
    trackingId: { type: String, required: true, index: true },
    destinationUrl: { type: String, required: true },
    clickedAt: { type: Date, default: Date.now, index: true },
    ipHash: { type: String },
    userAgent: { type: String },
    referer: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: false,
  }
);

ClickEventSchema.index({ organizationId: 1, clickedAt: -1 });
ClickEventSchema.index({ organizationId: 1, recipientId: 1 });
ClickEventSchema.index({ organizationId: 1, campaignId: 1, clickedAt: -1 });

export const ClickEventModel: Model<IClickEventDocument> =
  mongoose.models.ClickEvent || mongoose.model<IClickEventDocument>("ClickEvent", ClickEventSchema);
