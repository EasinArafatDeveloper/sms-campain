/**
 * Single source of truth for the product name and marketing copy.
 * Rename the product by changing NEXT_PUBLIC_APP_NAME (or the fallback below) — every page,
 * the SMS OTP text, page titles and the sidebar read from here.
 */
export const BRAND = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Postman",
  tagline: "Trackable SMS marketing",
  shortDescription:
    "Send SMS campaigns with a unique short link for every recipient, see exactly who clicked, and follow up with the people who are ready to buy.",
  /** Prefix for browser storage keys / cookie names so they follow the brand. */
  slug: "postman",
  year: new Date().getFullYear(),
} as const;
