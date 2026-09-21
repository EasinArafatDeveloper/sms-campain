import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPhoneVerificationDocument extends Document {
  phone: string;
  hashedCode: string;
  salt: string;
  attempts: number;
  verified: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const PhoneVerificationSchema = new Schema<IPhoneVerificationDocument>(
  {
    phone: { type: String, required: true, index: true },
    hashedCode: { type: String, required: true },
    salt: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

// 5-minute MongoDB TTL index on expiresAt
PhoneVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
PhoneVerificationSchema.index({ phone: 1, verified: 1 });

export const PhoneVerificationModel: Model<IPhoneVerificationDocument> =
  mongoose.models.PhoneVerification ||
  mongoose.model<IPhoneVerificationDocument>("PhoneVerification", PhoneVerificationSchema);
