import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null) return "0";
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercentage(value: number | undefined | null): string {
  if (value === undefined || value === null) return "0.0%";
  return `${value.toFixed(1)}%`;
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatDate(date: Date | string | undefined | null): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | undefined | null): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/**
 * Normalizes phone numbers to standard format (e.g. Bangladesh 88017... or international E.164)
 */
export function normalizePhoneNumber(phone: string): { normalized: string; isValid: boolean; country: string } {
  if (!phone) return { normalized: "", isValid: false, country: "UNKNOWN" };
  
  // Strip non-digits except leading +
  let cleaned = phone.trim().replace(/[^\d+]/g, "");
  
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  // Handle local Bangladesh numbers starting with 01...
  if (/^01[3-9]\d{8}$/.test(cleaned)) {
    return {
      normalized: `880${cleaned.substring(1)}`,
      isValid: true,
      country: "BD",
    };
  }

  // Handle Bangladesh numbers already having 8801...
  if (/^8801[3-9]\d{8}$/.test(cleaned)) {
    return {
      normalized: cleaned,
      isValid: true,
      country: "BD",
    };
  }

  // International format fallback (e.g., US 1..., UK 44..., etc.)
  if (cleaned.length >= 7 && cleaned.length <= 15) {
    return {
      normalized: cleaned,
      isValid: true,
      country: "INTL",
    };
  }

  return {
    normalized: cleaned,
    isValid: false,
    country: "INVALID",
  };
}

/**
 * Calculates SMS character counts and segments
 */
export function calculateSmsSegments(text: string): {
  characters: number;
  segments: number;
  remainingInSegment: number;
  isUnicode: boolean;
} {
  const isUnicode = /[^\u0000-\u007F]/.test(text);
  const length = text.length;

  if (length === 0) {
    return { characters: 0, segments: 0, remainingInSegment: isUnicode ? 70 : 160, isUnicode };
  }

  if (!isUnicode) {
    if (length <= 160) {
      return { characters: length, segments: 1, remainingInSegment: 160 - length, isUnicode: false };
    }
    const segments = Math.ceil(length / 153);
    const remaining = segments * 153 - length;
    return { characters: length, segments, remainingInSegment: remaining, isUnicode: false };
  } else {
    if (length <= 70) {
      return { characters: length, segments: 1, remainingInSegment: 70 - length, isUnicode: true };
    }
    const segments = Math.ceil(length / 67);
    const remaining = segments * 67 - length;
    return { characters: length, segments, remainingInSegment: remaining, isUnicode: true };
  }
}
