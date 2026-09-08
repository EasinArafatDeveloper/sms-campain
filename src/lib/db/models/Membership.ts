import mongoose, { Schema, Document, Model } from "mongoose";
import { UserRole } from "@/types";

export interface IMembershipDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: UserRole;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembershipDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: {
      type: String,
      enum: ["owner", "admin", "manager", "analyst", "viewer"],
      default: "manager",
    },
    permissions: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

MembershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export const MembershipModel: Model<IMembershipDocument> =
  mongoose.models.Membership || mongoose.model<IMembershipDocument>("Membership", MembershipSchema);
