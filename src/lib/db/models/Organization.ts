import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrganizationDocument extends Document {
  name: string;
  slug: string;
  plan: "starter" | "growth" | "enterprise";
  status: "active" | "suspended";
  senderIds: string[];
  defaultSenderId: string;
  trackingDomain: string;
  settings: {
    defaultTrackingLength: number;
    defaultTrackingFormat: "numeric" | "alphanumeric";
    retentionDays: number;
    enableWebhooks: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganizationDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    plan: { type: String, enum: ["starter", "growth", "enterprise"], default: "growth" },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    senderIds: { type: [String], default: ["MYBRAND", "SMSPRO", "8809648910379"] },
    defaultSenderId: { type: String, default: "8809648910379" },
    trackingDomain: { type: String, default: "https://go.mybrand.com" },
    settings: {
      defaultTrackingLength: { type: Number, default: 6 },
      defaultTrackingFormat: { type: String, enum: ["numeric", "alphanumeric"], default: "numeric" },
      retentionDays: { type: Number, default: 90 },
      enableWebhooks: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

export const OrganizationModel: Model<IOrganizationDocument> =
  mongoose.models.Organization || mongoose.model<IOrganizationDocument>("Organization", OrganizationSchema);
