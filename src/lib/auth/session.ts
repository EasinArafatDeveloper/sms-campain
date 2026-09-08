import { cookies } from "next/headers";
import { verifySessionToken, SessionPayload } from "./jwt";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel, OrganizationModel, MembershipModel } from "@/lib/db/models";
import bcrypt from "bcryptjs";

export const SESSION_COOKIE_NAME = "smspro_session";

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

  const isMatch = await comparePassword(passwordPlain, user.passwordHash);
  if (!isMatch) return null;

  // Find membership & organization
  let membership = await MembershipModel.findOne({ userId: user._id });
  let org = membership ? await OrganizationModel.findById(membership.organizationId) : null;

  if (!org) {
    org = await OrganizationModel.findOne();
    if (!org) {
      org = await OrganizationModel.create({
        name: "SMSPro Demo Org",
        slug: "smspro-demo",
        plan: "enterprise",
      });
    }
    membership = await MembershipModel.create({
      organizationId: org._id,
      userId: user._id,
      role: user.role || "owner",
    });
  }

  return {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: membership?.role || "owner",
    organizationId: org._id.toString(),
    organizationName: org.name,
    organizationSlug: org.slug,
  };
}
