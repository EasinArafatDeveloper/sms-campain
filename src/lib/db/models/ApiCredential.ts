import mongoose, { Schema, Document, Model } from "mongoose";

export interface IApiCredentialDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  provider: "bulksmsbd" | "mock" | "generic";
  name: string;
  apiKey: string;
  senderId: string;
  apiUrl?: string;
  isDefault: boolean;
  status: "active" | "inactive";
  balance?: number;
  lastCheckedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApiCredentialSchema = new Schema<IApiCredentialDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    provider: { type: String, enum: ["bulksmsbd", "mock", "generic"], default: "bulksmsbd" },
    name: { type: String, required: true },
    apiKey: { type: String, required: true },
    senderId: { type: String, required: true },
    apiUrl: { type: String },
    isDefault: { type: Boolean, default: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    balance: { type: Number, default: 0 },
    lastCheckedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

ApiCredentialSchema.index({ organizationId: 1, isDefault: 1 });

export const ApiCredentialModel: Model<IApiCredentialDocument> =
  mongoose.models.ApiCredential ||
  mongoose.model<IApiCredentialDocument>("ApiCredential", ApiCredentialSchema);
