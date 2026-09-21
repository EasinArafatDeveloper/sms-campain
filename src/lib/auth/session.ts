import { cookies } from "next/headers";
import { verifySessionToken, SessionPayload } from "./jwt";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel, OrganizationModel, MembershipModel } from "@/lib/db/models";
import bcrypt from "bcryptjs";
import { BRAND } from "@/lib/brand";

export const SESSION_COOKIE_NAME = `${BRAND.slug}_session`;

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function authenticateUser(email: string, passwordPlain: string): Promise<SessionPayload | null> {
  await connectToDatabase();
  const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
  if (!user || !user.passwordHash) return null;

  if (user.status === "disabled") {
    throw new Error("ACCOUNT_DISABLED");
  }

  const isMatch = await comparePassword(passwordPlain, user.passwordHash);
  if (!isMatch) return null;

  // Find user's actual membership
  let membership = await MembershipModel.findOne({ userId: user._id });
  let org = membership ? await OrganizationModel.findById(membership.organizationId) : null;

  if (!org && user.defaultOrganizationId) {
    org = await OrganizationModel.findById(user.defaultOrganizationId);
  }

  // If user truly has no org, create an isolated personal workspace for this user
  if (!org) {
    const slug = `${user.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-4)}`;
    org = await OrganizationModel.create({
      name: `${user.name}'s Workspace`,
      slug,
      plan: "growth",
      smsCredits: 20,
      senderIds: ["8809612781020", "SMSPRO"],
      defaultSenderId: "8809612781020",
    });

    membership = await MembershipModel.create({
      organizationId: org._id,
      userId: user._id,
      role: "owner",
    });

    user.defaultOrganizationId = org._id as any;
    await user.save();
  }

  return {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: membership?.role || "owner",
    platformRole: user.platformRole || "user",
    organizationId: org._id.toString(),
    organizationName: org.name,
    organizationSlug: org.slug,
  };
}
