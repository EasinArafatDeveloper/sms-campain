import mongoose, { Schema, Document, Model } from "mongoose";
import { DeliveryStatus } from "@/types";

export interface IDeliveryJobDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  trackingId: string;
  phone: string;
  message: string;
  senderId: string;
  provider: string;
  status: DeliveryStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryJobSchema = new Schema<IDeliveryJobDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "Recipient", required: true, index: true },
    trackingId: { type: String, required: true },
    phone: { type: String, required: true },
    message: { type: String, required: true },
    senderId: { type: String, required: true },
    provider: { type: String, default: "bulksmsbd" },
    status: {
      type: String,
      enum: ["queued", "processing", "sent", "delivered", "failed", "retrying", "pending_retry"],
      default: "queued",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    lastAttemptAt: { type: Date },
    nextRetryAt: { type: Date },
    providerMessageId: { type: String, index: true },
    errorCode: { type: String },
    errorMessage: { type: String },
  },
  {
    timestamps: true,
  }
);

DeliveryJobSchema.index({ organizationId: 1, status: 1 });
DeliveryJobSchema.index({ organizationId: 1, campaignId: 1, status: 1 });
DeliveryJobSchema.index({ nextRetryAt: 1, status: 1 });

export const DeliveryJobModel: Model<IDeliveryJobDocument> =
  mongoose.models.DeliveryJob || mongoose.model<IDeliveryJobDocument>("DeliveryJob", DeliveryJobSchema);
