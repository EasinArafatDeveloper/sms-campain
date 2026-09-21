import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

const AUTH_SECRET = env.AUTH_SECRET;
const secretKey = new TextEncoder().encode(AUTH_SECRET);

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  platformRole?: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  [key: string]: unknown;
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
