import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITrackingLinkDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  trackingId: string;
  destinationUrl: string;
  uniqueUrl: string;
  status: "active" | "expired" | "disabled";
  clickCount: number;
  firstClickedAt?: Date;
  lastClickedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TrackingLinkSchema = new Schema<ITrackingLinkDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "Recipient", required: true, index: true },
    trackingId: { type: String, required: true, unique: true, index: true },
    destinationUrl: { type: String, required: true },
    uniqueUrl: { type: String, required: true },
    status: { type: String, enum: ["active", "expired", "disabled"], default: "active", index: true },
    clickCount: { type: Number, default: 0 },
    firstClickedAt: { type: Date },
    lastClickedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

TrackingLinkSchema.index({ organizationId: 1, campaignId: 1, recipientId: 1 });
TrackingLinkSchema.index({ organizationId: 1, trackingId: 1 });

export const TrackingLinkModel: Model<ITrackingLinkDocument> =
  mongoose.models.TrackingLink || mongoose.model<ITrackingLinkDocument>("TrackingLink", TrackingLinkSchema);
