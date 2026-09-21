import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { UserModel, OrganizationModel, MembershipModel } from "../src/lib/db/models";

// Load .env.local if exists
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI;

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || "admin@smspro.io";
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || "SuperAdmin@2026!";
const SUPERADMIN_NAME = "Super Admin";

async function main() {
  if (!MONGODB_URI) {
    console.error("❌ Error: MONGODB_URI is not defined in .env.local or environment.");
    process.exit(1);
  }

  console.log(`[SuperAdmin Setup] Connecting to MongoDB...`);
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
  });
  console.log(`[SuperAdmin Setup] Connected to MongoDB Atlas.`);

  const passwordHash = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);

  // 1. Find or create master organization
  let org = await OrganizationModel.findOne({ slug: "master-admin" });
  if (!org) {
    org = await OrganizationModel.create({
      name: "Postman HQ",
      slug: "master-admin",
      plan: "enterprise",
      status: "active",
      smsCredits: 100000,
      senderIds: ["8809612781020", "SMSPRO", "MYBRAND"],
      defaultSenderId: "8809612781020",
      trackingDomain: "https://postman.asia",
    });
    console.log(`✅ Master Organization created: ${org.name} (${org._id})`);
  }

  // 2. Find or create superadmin user
  let user = await UserModel.findOne({ email: SUPERADMIN_EMAIL.toLowerCase() });
  if (user) {
    user.platformRole = "superadmin";
    user.role = "owner";
    user.passwordHash = passwordHash;
    user.isPhoneVerified = true;
    user.status = "active";
    if (!user.defaultOrganizationId) {
      user.defaultOrganizationId = org._id as any;
    }
    await user.save();
    console.log(`✅ Existing user updated to SuperAdmin: ${user.email}`);
  } else {
    user = await UserModel.create({
      name: SUPERADMIN_NAME,
      email: SUPERADMIN_EMAIL.toLowerCase(),
      passwordHash,
      role: "owner",
      platformRole: "superadmin",
      phone: "8801840801269",
      isPhoneVerified: true,
      status: "active",
      defaultOrganizationId: org._id,
    });
    console.log(`✅ New SuperAdmin user created: ${user.email}`);
  }

  // 3. Ensure membership
  const membership = await MembershipModel.findOne({
    organizationId: org._id,
    userId: user._id,
  });

  if (!membership) {
    await MembershipModel.create({
      organizationId: org._id,
      userId: user._id,
      role: "owner",
      permissions: ["*"],
    });
    console.log(`✅ Membership created for SuperAdmin.`);
  }

  console.log("\n==================================================");
  console.log("🎉 SUPER ADMIN ACCOUNT IS READY!");
  console.log("==================================================");
  console.log(`📧 Email:    ${user.email}`);
  console.log(`🔑 Password: ${SUPERADMIN_PASSWORD}`);
  console.log(`👑 Role:     ${user.role} | Platform: ${user.platformRole}`);
  console.log(`🌐 Login URL: /login`);
  console.log(`⚡ Admin URL: /admin`);
  console.log("==================================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal error setting up Super Admin:", err);
  process.exit(1);
});
