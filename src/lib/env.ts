import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  ZENDSMS_API_KEY: z.string().optional().default(""),
  ZENDSMS_SENDER_ID: z.string().optional().default("8809612781020"),
  ZENDSMS_API_URL: z.string().optional().default("https://api.zendsms.com/api/v1/send-sms"),
  ZENDSMS_BALANCE_URL: z.string().optional().default("https://api.zendsms.com/api/v1/balance"),
  WEBHOOK_SECRET: z.string().optional(),
  TRACKING_BASE_URL: z.string().optional().default("https://sms-campain.vercel.app"),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI || (process.env.NODE_ENV === "test" ? "mongodb://localhost:27017/smspro_test" : process.env.MONGODB_URI),
  AUTH_SECRET: process.env.AUTH_SECRET || (process.env.NODE_ENV === "test" ? "smspro_test_secret_key_32_chars_long_1234" : undefined),
  ZENDSMS_API_KEY: process.env.ZENDSMS_API_KEY,
  ZENDSMS_SENDER_ID: process.env.ZENDSMS_SENDER_ID,
  ZENDSMS_API_URL: process.env.ZENDSMS_API_URL,
  ZENDSMS_BALANCE_URL: process.env.ZENDSMS_BALANCE_URL,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
  TRACKING_BASE_URL: process.env.TRACKING_BASE_URL,
});
