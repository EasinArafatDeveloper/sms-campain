import mongoose, { Schema, Document, Model } from "mongoose";
import { IAudienceRule } from "@/types";

export interface IAudienceSegmentDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  rules: IAudienceRule[];
  estimatedCount: number;
  isSystem?: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AudienceSegmentSchema = new Schema<IAudienceSegmentDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    rules: { type: Schema.Types.Mixed, default: [] },
    estimatedCount: { type: Number, default: 0 },
    isSystem: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

AudienceSegmentSchema.index({ organizationId: 1, name: 1 });

export const AudienceSegmentModel: Model<IAudienceSegmentDocument> =
  mongoose.models.AudienceSegment ||
  mongoose.model<IAudienceSegmentDocument>("AudienceSegment", AudienceSegmentSchema);
