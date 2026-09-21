import mongoose, { Schema, Document, Model } from "mongoose";
import { UserRole, PlatformRole } from "@/types";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  phone?: string;
  isPhoneVerified: boolean;
  passwordHash?: string;
  avatar?: string;
  role: UserRole;
  platformRole: PlatformRole;
  status: "active" | "invited" | "disabled";
  defaultOrganizationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, sparse: true, trim: true },
    isPhoneVerified: { type: Boolean, default: false },
    passwordHash: { type: String },
    avatar: { type: String },
    role: {
      type: String,
      enum: ["owner", "admin"],
      default: "owner",
    },
    platformRole: {
      type: String,
      enum: ["user", "superadmin"],
      default: "user",
    },
    status: { type: String, enum: ["active", "invited", "disabled"], default: "active" },
    defaultOrganizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
  },
  {
    timestamps: true,
  }
);

export const UserModel: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
