import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDeliveryEventDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  trackingId?: string;
  provider: string;
  providerMessageId: string;
  eventType: "queued" | "sent" | "delivered" | "failed" | "undelivered";
  payload: Record<string, unknown>;
  occurredAt: Date;
}

const DeliveryEventSchema = new Schema<IDeliveryEventDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "Recipient", required: true, index: true },
    trackingId: { type: String, index: true },
    provider: { type: String, required: true },
    providerMessageId: { type: String, required: true, index: true },
    eventType: {
      type: String,
      enum: ["queued", "sent", "delivered", "failed", "undelivered"],
      required: true,
      index: true,
    },
    payload: { type: Schema.Types.Mixed, default: {} },
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  }
);

DeliveryEventSchema.index({ providerMessageId: 1, eventType: 1 });
DeliveryEventSchema.index({ organizationId: 1, occurredAt: -1 });

export const DeliveryEventModel: Model<IDeliveryEventDocument> =
  mongoose.models.DeliveryEvent || mongoose.model<IDeliveryEventDocument>("DeliveryEvent", DeliveryEventSchema);
