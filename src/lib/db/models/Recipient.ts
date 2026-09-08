import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRecipientDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  phone: string;
  name?: string;
  customId?: string;
  metadata?: Record<string, unknown>;
  status: "active" | "opted_out" | "invalid";
  createdAt: Date;
  updatedAt: Date;
}

const RecipientSchema = new Schema<IRecipientDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    phone: { type: String, required: true, trim: true },
    name: { type: String, trim: true },
    customId: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
    status: { type: String, enum: ["active", "opted_out", "invalid"], default: "active", index: true },
  },
  {
    timestamps: true,
  }
);

RecipientSchema.index({ organizationId: 1, phone: 1 }, { unique: true });
RecipientSchema.index({ organizationId: 1, createdAt: -1 });

export const RecipientModel: Model<IRecipientDocument> =
  mongoose.models.Recipient || mongoose.model<IRecipientDocument>("Recipient", RecipientSchema);
