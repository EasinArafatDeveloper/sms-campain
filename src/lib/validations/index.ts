import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
});

export const CreateCampaignSchema = z.object({
  name: z.string().min(2, "Campaign name is required"),
  senderId: z.string().min(2, "Sender ID is required"),
  message: z.string().min(1, "Message cannot be empty").refine((val) => val.includes("{TRACKABLE_LINK}"), {
    message: "Message must contain the {TRACKABLE_LINK} merge tag",
  }),
  audienceType: z.enum(["upload", "existing", "crm", "segment", "retargeting"]),
  audienceId: z.string().optional(),
  audienceName: z.string().optional(),
  destinationUrl: z.string().url("Valid destination URL required"),
  trackingFormat: z.enum(["numeric", "alphanumeric"]).default("numeric"),
  trackingLength: z.number().min(4).max(12).default(6),
  scheduledAt: z.string().optional(),
  contacts: z
    .array(
      z.object({
        phone: z.string(),
        name: z.string().optional(),
        customId: z.string().optional(),
      })
    )
    .optional(),
});

export const CreateAudienceSegmentSchema = z.object({
  name: z.string().min(2, "Segment name is required"),
  description: z.string().optional(),
  rules: z.array(
    z.object({
      field: z.enum(["campaignsClicked", "totalClicks", "lastClickWithinDays", "engagementScore", "leadStatus"]),
      operator: z.enum(["gte", "lte", "eq", "in"]),
      value: z.union([z.number(), z.string(), z.array(z.string())]),
    })
  ),
});

export const UpdateSettingsSchema = z.object({
  name: z.string().min(2, "Organization name is required"),
  defaultSenderId: z.string().min(2, "Default Sender ID is required"),
  trackingDomain: z.string().url("Valid tracking domain required"),
  defaultTrackingLength: z.number().min(4).max(12),
  defaultTrackingFormat: z.enum(["numeric", "alphanumeric"]),
  retentionDays: z.number().min(7).max(365),
  enableWebhooks: z.boolean(),
});

export const SaveSmsProviderSchema = z.object({
  provider: z.enum(["bulksmsbd", "mock", "generic"]),
  name: z.string().min(2, "Provider name is required"),
  apiKey: z.string().min(4, "API Key is required"),
  senderId: z.string().min(2, "Sender ID is required"),
  apiUrl: z.string().url().optional().or(z.literal("")),
  isDefault: z.boolean().default(true),
});

export const SendTestSmsSchema = z.object({
  phone: z.string().min(8, "Phone number is required"),
  message: z.string().min(1, "Message is required"),
  senderId: z.string().optional(),
});
