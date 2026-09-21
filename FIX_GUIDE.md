# SMSPro — Fix Guide (copy-paste runbook)

Ei guide ta audit er shob problem step-by-step fix kore. Protyek step a: **kon file**, **ki korbe**, **kon code paste korbe**.
Order maintain koro. Phase 0 ar 1 na kore Phase 2+ korle lav nai.

Terminal: PowerShell / Git Bash, project folder `D:\office project 2` theke.

- [ ] Phase 0 — Secret rotate + git history clean (aajei)
- [ ] Phase 1 — Hardcoded secret remove, env fail-closed
- [ ] Phase 2 — Login guard (middleware + withTenant), RBAC, tenant safety
- [ ] Phase 3 — Public endpoint hardening, webhook, queue, rate limit
- [ ] Phase 4 — Wallet/credit, SMS OTP signup, Super Admin panel
- [ ] Phase 5 — Cleanup (deps, headers, tests)

---

## PHASE 0 — Secret rotate (code likhar age, ekhoni)

Ei 3 ta secret leak dhorte hobe (code + git history te ache, remote: `github.com/EasinArafatDeveloper/sms-campain`):

| Secret | Kothay rotate korbe |
|---|---|
| MongoDB user password | Atlas → Database Access → user `easinnextleaders_db_user` → Edit → new password |
| ZendSMS API key | ZendSMS dashboard → API keys → regenerate / delete old |
| `AUTH_SECRET` | nicher command diye notun ekta banao |

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

1. Notun value gula `.env.local` a boshao (`.env.local` gitignored, thik ache). Vercel/hosting a o Environment Variables update koro.
2. Atlas → **Network Access** → `0.0.0.0/0` thakle remove kore sudhu server IP allow koro (Vercel hole Vercel er IP range / Atlas-Vercel integration).
3. GitHub repo ta ekhoni **Private** koro (Settings → Danger Zone) jodi public hoy.
4. Git history theke secret muchbe (rotate korar **por**):

```bash
pip install git-filter-repo
git clone --mirror https://github.com/EasinArafatDeveloper/sms-campain.git sms-campain-clean.git
cd sms-campain-clean.git
```

`replacements.txt` file banao (ei folder er baire, jemon `D:\replacements.txt`):

```
regex:sk_[a-z0-9]{30,}==>REMOVED_API_KEY
regex:mongodb\+srv://[^@\s"']+@==>mongodb+srv://REMOVED@
smspro_enterprise_super_secret_jwt_key_2026_x89271409128371293==>REMOVED_SECRET
```

```bash
git filter-repo --replace-text D:/replacements.txt
git push --force --mirror
```

Tarpor tomar working folder a fresh `git clone` koro (purono clone a purono history thakbe).

> Notun secret age theke rotate kora ache, tai history clean korar por o purono key kono kaje lagbe na. Eta-i asol safety.

Optional: secret scanner (pre-commit a dhorbe):

```bash
npx gitleaks detect --source . -v
```

---

## PHASE 1 — Hardcoded secret remove

### 1.1 `src/lib/auth/jwt.ts` — puro file replace koro

```ts
import { SignJWT, jwtVerify } from "jose";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or shorter than 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  platformRole?: string;
  [key: string]: unknown;
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    if (payload.purpose) return null; // phone/OTP tokens must never work as a session
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// Short-lived token proving a phone number was verified via SMS OTP (used in Phase 4)
export async function signPhoneToken(phone: string): Promise<string> {
  return new SignJWT({ phone, purpose: "signup-phone" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecretKey());
}

export async function verifyPhoneToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    if (payload.purpose !== "signup-phone" || typeof payload.phone !== "string") return null;
    return payload.phone;
  } catch {
    return null;
  }
}
```

### 1.2 `src/lib/db/connect.ts` — line 3 replace + check

Purono line 3 (`const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://..."`) **delete** kore:

```ts
import mongoose from "mongoose";
```

Tarpor `connectToDatabase` function er suru te ei 2 line add koro (`if (cached.conn)` er age), ar `mongoose.connect(MONGODB_URI, opts)` er jaygay `mongoose.connect(uri, opts)` likho:

```ts
export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(uri, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("[Database] MongoDB connection error:", e);
    throw e;
  }

  return cached.conn;
}
```

### 1.3 `src/lib/providers/zendsms.provider.ts` (constructor, line ~30-40)

`apiKey` ar `senderId` er hardcoded fallback muche felo:

```ts
    this.apiKey = config?.apiKey || process.env.ZENDSMS_API_KEY || "";
    this.senderId = config?.senderId || process.env.ZENDSMS_SENDER_ID || "";
```

Ar `sendSms` er suru te (`const { normalized, isValid } = ...` er age) add koro:

```ts
    if (!this.apiKey) {
      return { success: false, provider: this.name, error: "SMS gateway API key is not configured" };
    }
```

### 1.4 `src/lib/providers/index.ts` — puro file replace koro

Tenant er nijer credential na thakle **platform er key use hobe na** (Phase 4 a wallet bosale abar chalu hobe):

```ts
import { ISmsProvider } from "./sms-provider.interface";
import { ZendSmsProvider } from "./zendsms.provider";
import { MockSmsProvider } from "./mock.provider";
import { ApiCredentialModel } from "@/lib/db/models";

export * from "./sms-provider.interface";
export * from "./zendsms.provider";
export * from "./mock.provider";

export function getPlatformProvider(): ISmsProvider {
  return process.env.SMS_PROVIDER === "mock" ? new MockSmsProvider() : new ZendSmsProvider();
}

export async function orgHasOwnGateway(organizationId: string): Promise<boolean> {
  const cred = await ApiCredentialModel.exists({ organizationId, status: "active", isDefault: true });
  return !!cred;
}

/**
 * organizationId diye dile: sudhu oi org er nijer credential.
 * organizationId na dile: platform provider (webhook parse, health check, OTP).
 */
export async function getSmsProviderForOrg(organizationId?: string): Promise<ISmsProvider> {
  if (!organizationId) return getPlatformProvider();

  const cred = await ApiCredentialModel.findOne({
    organizationId,
    status: "active",
    isDefault: true,
  });

  if (!cred) {
    throw new Error("SMS gateway is not configured for this organization");
  }
  if (cred.provider === "mock") return new MockSmsProvider();

  return new ZendSmsProvider({
    apiKey: cred.apiKey,
    senderId: cred.senderId,
    apiUrl: cred.apiUrl,
  });
}
```

### 1.5 `src/app/api/auth/register/route.ts`

Ei block ta **puro delete** koro (line 55-66, `// Default ZendSMS Provider Credential` theke `ApiCredentialModel.create({...});` porjonto).
Ar line 3 theke `ApiCredentialModel` import remove koro:

```ts
import { UserModel, OrganizationModel, MembershipModel } from "@/lib/db/models";
```

Ar `Organization.create` a `senderIds` / `defaultSenderId` er hardcoded `8809612781020` muche felo (tomar platform sender ID ekta env theke nao):

```ts
    const org = await OrganizationModel.create({
      name: validated.data.organizationName,
      slug: `${slug}-${crypto.randomBytes(3).toString("hex")}`,
      plan: "starter",
      senderIds: [],
      defaultSenderId: process.env.ZENDSMS_SENDER_ID || "",
    });
```

File er top a add: `import crypto from "crypto";` (slug collision fix o hoye gelo).

### 1.6 `src/app/api/settings/route.ts` — puro file replace koro

Eta fix kore: auth fallback, API key leak (masked), mass-assignment, SSRF (`apiUrl` allowlist), fake team members, `upsert`.
`withTenant` Phase 2 a banabe — file ta ekhon likho, Phase 2 sesh hole compile hobe.

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { withTenant } from "@/lib/auth/guard";
import { OrganizationModel, ApiCredentialModel, UserModel } from "@/lib/db/models";
import { connectToDatabase } from "@/lib/db/connect";
import { getSmsProviderForOrg } from "@/lib/providers";

const ALLOWED_SMS_HOSTS = ["api.zendsms.com"];

const OrgSchema = z
  .object({
    name: z.string().min(2).max(100),
    defaultSenderId: z.string().min(2).max(20),
    trackingDomain: z.string().url().refine((v) => /^https?:\/\//.test(v), "http(s) only"),
    settings: z.object({
      defaultTrackingLength: z.number().min(3).max(12),
      defaultTrackingFormat: z.enum(["numeric", "alphanumeric"]),
      retentionDays: z.number().min(7).max(365),
      enableWebhooks: z.boolean(),
    }),
  })
  .partial();

const ProviderSchema = z.object({
  provider: z.enum(["zendsms", "mock", "generic"]),
  name: z.string().min(2).max(60),
  apiKey: z.string().max(200).optional(), // empty / masked = keep existing
  senderId: z.string().min(2).max(20),
  apiUrl: z
    .string()
    .url()
    .refine((v) => {
      try {
        const u = new URL(v);
        return u.protocol === "https:" && ALLOWED_SMS_HOSTS.includes(u.hostname);
      } catch {
        return false;
      }
    }, "apiUrl host is not allowed")
    .optional()
    .or(z.literal("")),
});

const mask = (key?: string) => (key ? `••••••••${key.slice(-4)}` : "");

export const GET = withTenant(async (_req, { orgId }) => {
  try {
    await connectToDatabase();
    const oid = new mongoose.Types.ObjectId(orgId);

    const [org, cred, teamMembers] = await Promise.all([
      OrganizationModel.findById(oid).lean(),
      ApiCredentialModel.findOne({ organizationId: oid, isDefault: true }).lean(),
      UserModel.find({ defaultOrganizationId: oid }).select("name email role status").lean(),
    ]);

    let balance: number | null = null;
    try {
      const provider = await getSmsProviderForOrg(orgId);
      balance = (await provider.getBalance()).balance ?? null;
    } catch {
      balance = null; // gateway not configured yet
    }

    return NextResponse.json({
      organization: org,
      providerConfig: cred
        ? {
            provider: cred.provider,
            name: cred.name,
            apiKey: mask(cred.apiKey),
            hasApiKey: !!cred.apiKey,
            senderId: cred.senderId,
            apiUrl: cred.apiUrl,
          }
        : null,
      balance,
      teamMembers,
    });
  } catch (err) {
    console.error("[Settings API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}, "settings:manage");

export const POST = withTenant(async (req, { orgId }) => {
  try {
    const body = await req.json();
    await connectToDatabase();
    const oid = new mongoose.Types.ObjectId(orgId);

    if (body.organization) {
      const parsed = OrgSchema.safeParse(body.organization);
      if (!parsed.success) {
        return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
      }
      await OrganizationModel.updateOne({ _id: oid }, { $set: parsed.data });
    }

    if (body.providerConfig) {
      const parsed = ProviderSchema.safeParse(body.providerConfig);
      if (!parsed.success) {
        return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
      }
      const { apiKey, ...rest } = parsed.data;
      const set: Record<string, unknown> = { ...rest };
      if (apiKey && !apiKey.startsWith("•")) set.apiKey = apiKey; // masked value back ashle overwrite korbe na

      await ApiCredentialModel.updateOne(
        { organizationId: oid, isDefault: true },
        { $set: set, $setOnInsert: { status: "active" } },
        { upsert: !!set.apiKey } // notun credential shudhu key thakle
      );
    }

    return NextResponse.json({ success: true, message: "Settings saved successfully" });
  } catch (err) {
    console.error("[Settings API] Update error:", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}, "settings:manage");
```

`src/app/settings/page.tsx` a:
- line 32: `useState("sk_agowww...")` → `useState("")`
- line 58: `setApiKey(data.providerConfig.apiKey || "sk_agowww...")` → `setApiKey("")`
- API key input a `placeholder={providerMasked || "Enter API key"}` diye dao, "blank = unchanged" likhe dao.
- `data.providerConfig` ekhon `null` hote pare — `data.providerConfig?.name ?? ""` use koro.
- Fake team fallback (`Omer Sharif` etc.) ar nai; `teamMembers` empty array hole empty state dekhao.

### 1.7 Scripts + tests + README

```bash
git rm scripts/update-zendsms-db.ts
```

`scripts/seed.ts` ar `scripts/reset-db.ts` — top a hardcoded Mongo URI/API key replace koro:

```ts
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI is not set");
if (process.env.NODE_ENV === "production") throw new Error("Refusing to run against production");
```

`apiKey: "sk_agowww..."` (seed.ts:91, reset-db.ts:94) → `apiKey: process.env.ZENDSMS_API_KEY || "test_key"`.

`package.json` a scripts update (Node 22 `--env-file` support kore):

```json
"seed": "tsx --env-file=.env.local scripts/seed.ts",
"reset": "tsx --env-file=.env.local scripts/reset-db.ts",
"worker": "tsx --env-file=.env.local scripts/worker.ts",
```

`tests/zendsms.test.ts:6` → `apiKey: "test_key_not_real"`.
`README.md` line 29 theke API key + sender ID muche `ZendSMS Official Provider Adapter` likhe dao.

Verify: kono secret baki nai:

```bash
git grep -nE "sk_[a-z0-9]{20,}|mongodb\+srv://[^<]+:[^<]+@"
```
(kichu na dekhale ok)

---

## PHASE 2 — Login guard, tenant safety, RBAC

### 2.1 `src/middleware.ts` — notun file (src folder er bhitore)

Page ar API dutoi login chara block kore. Tracking link (`/t/...`, `/eid-...`) ke touch kore na.

```ts
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "smspro_session";

// Login chara ei API gula khola thakbe
const PUBLIC_API = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/otp",
  "/api/health",
  "/api/tracking/verify",
  "/api/webhooks",
];

async function readSession(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret || secret.length < 32) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    if (payload.purpose) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (isApi && PUBLIC_API.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const session = await readSession(req);
  if (!session) {
    if (isApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin");
  if (isAdminArea && session.platformRole !== "superadmin") {
    if (isApi) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/campaigns/:path*",
    "/link-generator/:path*",
    "/delivery-queue/:path*",
    "/click-analytics/:path*",
    "/active-leads/:path*",
    "/audiences/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
```

### 2.2 `src/lib/auth/guard.ts` — notun file

Ekta wrapper: session check, DB te user/org status check (suspend/disable kaj korbe), permission check, `orgId` inject.

```ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "./session";
import { hasPermission } from "./rbac";
import type { SessionPayload } from "./jwt";
import type { UserRole } from "@/types";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel, OrganizationModel } from "@/lib/db/models";

export interface TenantContext {
  session: SessionPayload;
  orgId: string;
  userId: string;
  params: any;
}

type Handler = (req: NextRequest, ctx: TenantContext) => Promise<Response>;

export function withTenant(handler: Handler, permission?: string) {
  return async (req: NextRequest, routeCtx?: { params?: Promise<any> }): Promise<Response> => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const [user, org] = await Promise.all([
      UserModel.findById(session.userId).select("status").lean(),
      OrganizationModel.findById(new mongoose.Types.ObjectId(session.organizationId)).select("status").lean(),
    ]);
    if (!user || user.status !== "active") {
      return NextResponse.json({ error: "Account disabled" }, { status: 403 });
    }
    if (!org || org.status !== "active") {
      return NextResponse.json({ error: "Organization suspended" }, { status: 403 });
    }

    if (permission && !hasPermission(session.role as UserRole, permission)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const params = routeCtx?.params ? await routeCtx.params : {};
    return handler(req, { session, orgId: session.organizationId, userId: session.userId, params });
  };
}

export function withSuperAdmin(
  handler: (req: NextRequest, ctx: { userId: string; params: any }) => Promise<Response>
) {
  return async (req: NextRequest, routeCtx?: { params?: Promise<any> }): Promise<Response> => {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const user = await UserModel.findById(session.userId).select("status platformRole").lean();
    if (!user || user.status !== "active" || user.platformRole !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const params = routeCtx?.params ? await routeCtx.params : {};
    return handler(req, { userId: session.userId, params });
  };
}
```

`src/lib/auth/index.ts` a ek line add: `export * from "./guard";`

`src/lib/db/models/User.ts` a `platformRole` add koro (interface + schema):

```ts
// interface a:
  platformRole?: "none" | "superadmin";
  phone?: string;
// schema a (status er niche):
    platformRole: { type: String, enum: ["none", "superadmin"], default: "none" },
    phone: { type: String, unique: true, sparse: true },
```

### 2.3 `src/lib/auth/session.ts` — `authenticateUser` replace koro (line 33-70)

Membership chara user ke arbitrary org a dhukano bondho, disabled/suspended block, timing leak kom:

```ts
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.Y8m0aWq5sV3o6yq0q7mY0tQ1u4hG";

export async function authenticateUser(email: string, passwordPlain: string): Promise<SessionPayload | null> {
  await connectToDatabase();
  const user = await UserModel.findOne({ email: email.toLowerCase().trim() });

  // user na thakleo hash compare kori jate response time ek-i thake
  const isMatch = await comparePassword(passwordPlain, user?.passwordHash || DUMMY_HASH);
  if (!user || !user.passwordHash || !isMatch) return null;
  if (user.status !== "active") return null;

  const membership = await MembershipModel.findOne({ userId: user._id }).sort({ createdAt: 1 });
  if (!membership) return null; // kono org e add na hole login nai

  const org = await OrganizationModel.findById(membership.organizationId);
  if (!org || org.status !== "active") return null;

  return {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: membership.role,
    organizationId: org._id.toString(),
    organizationName: org.name,
    organizationSlug: org.slug,
    platformRole: user.platformRole || "none",
  };
}
```

`bcrypt.genSalt(10)` → cost 12 kore dao: `hashPassword` a `bcrypt.genSalt(12)`.

### 2.4 Route migrate koro (18 ta file) — mechanical recipe

**Purono pattern:**
```ts
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";
    ...
  } catch (err) { ... }
}
```

**Notun pattern:**
```ts
import { withTenant } from "@/lib/auth/guard";

export const GET = withTenant(async (req, { orgId }) => {
  try {
    ...
  } catch (err) { ... }
}, "analytics:read");
```

Rules:
- `getSession` import muche `withTenant` import koro. `session?.userId || "6700...02"` er jaygay `userId` (ctx theke) use koro.
- Dynamic route (`[id]`, `[campaignId]`) a params ctx theke: `async (req, { orgId, params }) => { const { id } = params; ...`
- Function er shesh `}` → `}, "permission");`
- Shob `"670000000000000000000001"` fallback **muche felo**. Check: `git grep 6700000000000000000000`  → kichu na thakle ok.

Permission map:

| File | Method | Permission |
|---|---|---|
| `api/dashboard`, `api/analytics`, `api/analytics/attributions`, `api/reports`, `api/active-leads` | GET | `analytics:read` |
| `api/campaigns` | GET / POST | `campaigns:read` / `campaigns:create` |
| `api/campaigns/[id]` | GET / DELETE | `campaigns:read` / `campaigns:delete` |
| `api/campaigns/[id]/send` | POST | `campaigns:send` |
| `api/delivery-queue`, `api/delivery-queue/health` | GET | `campaigns:read` |
| `api/delivery-queue/process` | POST | `campaigns:send` |
| `api/audiences` | GET / POST | `campaigns:read` / `audiences:manage` |
| `api/exports/*` (4 ta) | GET | `reports:export` |
| `api/settings`, `api/settings/test-sms` | GET, POST | `settings:manage` |

Example — `src/app/api/dashboard/route.ts` puro file:

```ts
import { NextResponse } from "next/server";
import { withTenant } from "@/lib/auth/guard";
import { DashboardService } from "@/lib/services/dashboard.service";

export const GET = withTenant(async (_req, { orgId }) => {
  try {
    const metrics = await DashboardService.getMetrics(orgId);
    return NextResponse.json(metrics);
  } catch (err) {
    console.error("[Dashboard API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch dashboard metrics" }, { status: 500 });
  }
}, "analytics:read");
```

Example — `campaigns/[id]/route.ts` DELETE:

```ts
export const DELETE = withTenant(async (_req, { orgId, userId, params }) => {
  try {
    const { id } = params;
    const result = await CampaignService.deleteCampaign(orgId, id, userId);
    if (!result.success) {
      return NextResponse.json({ error: "Campaign not found or already deleted" }, { status: 404 });
    }
    return NextResponse.json({ success: true, deletedCounts: result.deletedCounts });
  } catch (err) {
    console.error("[Campaign API] Delete error:", err);
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}, "campaigns:delete");
```

Extra: `campaigns/route.ts` POST er `err.message` client ke pathano bondho koro: `{ error: "Failed to create campaign" }`. `campaigns/[id]` GET a `limit` cap koro: `const limit = Math.min(100, Math.max(1, parseInt(...)))`. `id` ObjectId valid kina check: `if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });`

`settings/test-sms` a response theke `raw: result.rawResponse` remove koro (gateway internals leak). Ar test SMS er upor rate limit dao (Phase 3.5).

### 2.5 Verify (dev server: `npm run dev`)

```bash
# 401 dekhabe (age 200 dito):
curl.exe -i http://localhost:3000/api/dashboard
curl.exe -i -X DELETE http://localhost:3000/api/campaigns/670000000000000000000010
# page redirect /login a:
curl.exe -i http://localhost:3000/dashboard
```

Login kore browser a dashboard cholbe, ar `viewer` role diye campaign delete korle 403.

---

## PHASE 3 — Public endpoint hardening, webhook, queue, rate limit

### 3.1 Regex injection fix

`src/lib/utils/index.ts` a add:

```ts
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
```

Ei 4 file a `options.search` er age escape koro (protyek `{ $regex: options.search, ...}` → `{ $regex: escapeRegex(options.search), ...}`):

- `src/lib/services/delivery.service.ts` (3 jaygay, line ~110-112)
- `src/lib/services/audience.service.ts` (~120-121)
- `src/lib/services/analytics.service.ts` (~123-124)
- `src/lib/services/campaign.service.ts` (~275)

Import: `import { escapeRegex } from "@/lib/utils";`

### 3.2 Tracking lookup (public, login chara) — `tracking.service.ts`

`resolveAndTrackClick` er `const link = await TrackingLinkModel.findOne({...})` (line ~287-298) replace:

```ts
    const cleanId = (trackingId || "").trim();
    if (!cleanId || cleanId.length > 64) {
      return { destinationUrl: null, isBot: false };
    }
    const subId = cleanId.includes("-") ? cleanId.split("-").slice(1).join("-") : cleanId;
    const candidates = Array.from(new Set([cleanId, cleanId.toLowerCase(), subId, subId.toLowerCase()]));

    const link = await TrackingLinkModel.findOne({
      $or: [
        { trackingId: { $in: candidates } },
        { uniqueUrl: { $regex: new RegExp(`/${escapeRegex(cleanId)}$`, "i") } },
      ],
      status: "active",
    });
```

(Purono `const cleanId` / `const subId` line 2 ta delete koro, duplicate hobe.)
`recordVerifiedHumanClick` a (line ~438-446) `{ uniqueUrl: { $regex: new RegExp(`/${cleanId}$`, "i") } }` → `escapeRegex(cleanId)` diye.
Import: `import { escapeRegex } from "@/lib/utils";`

### 3.3 Fake click bondho — `src/app/api/tracking/verify/route.ts`

`trackingId` diye verify korte dewa bondho, sudhu random token:

```ts
import { NextRequest, NextResponse } from "next/server";
import { TrackingService } from "@/lib/services/tracking.service";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    if (!(await rateLimit(`verify:${getClientIp(req)}`, "verify", 60, 60))) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }
    const body = await req.json();
    const { token, screenWidth, screenHeight, hasTouch, renderTimeMs } = body;

    if (typeof token !== "string" || !/^[a-f0-9]{32}$/.test(token)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const result = await TrackingService.recordVerifiedHumanClick(token, undefined, {
      screenWidth,
      screenHeight,
      hasTouch,
      renderTimeMs,
    });
    return NextResponse.json({ ok: true, verified: result.verified }, { status: 200 });
  } catch (err) {
    console.error("[Tracking Verification] Beacon error:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
```

`tracking.service.ts` `recordVerifiedHumanClick` a (line ~399-406) `trackingId` branch **delete**:

```ts
    if (!token) return { success: false, verified: false };
    const query: any = { "metadata.verifyToken": token };
```

Ar `ClickEvent` model a `metadata.verifyToken` a index dao (perf): `ClickEventSchema.index({ "metadata.verifyToken": 1 }, { sparse: true });`
Ar TTL (data growth): `ClickEventSchema.index({ clickedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });`

### 3.4 `javascript:` + XSS fix

`src/lib/validations/index.ts` — top a add ar 2 jaygay use koro:

```ts
export const httpUrl = z
  .string()
  .url()
  .max(2048)
  .refine((v) => {
    try {
      const p = new URL(v).protocol;
      return p === "http:" || p === "https:";
    } catch {
      return false;
    }
  }, "Only http(s) URLs are allowed");
```

- `CreateCampaignSchema.destinationUrl: z.string().url("Valid destination URL required")` → `httpUrl`
- `UpdateSettingsSchema.trackingDomain` → `httpUrl`

`tracking.service.ts` `generateTrampolineHtml` (line 174-254): function er **suru** (line 175-176 replace) ar 3 ta line (183, 226-228) change:

```ts
  static generateTrampolineHtml(destinationUrl: string, trackingId: string, verifyToken: string): string {
    // Only http(s) destinations can ever be rendered
    let dest = "/";
    try {
      const u = new URL(destinationUrl);
      if (u.protocol === "http:" || u.protocol === "https:") dest = u.toString();
    } catch {}

    const attr = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const js = (v: unknown) =>
      JSON.stringify(v)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
```

Template er bhitore:
- `<meta http-equiv="refresh" content="1;url=${safeDest}">` → `content="1;url=${attr(dest)}"`
- `var dest = "${safeDest.replace(...)}";` → `var dest = ${js(dest)};`
- `var token = "${verifyToken}";` → `var token = ${js(verifyToken)};`
- `var trk = "${safeId....}";` → `var trk = ${js(trackingId)};`
- `trackingId: trk,` payload theke **bad dao** (token-only verify).

Purono `safeDest`/`safeId` const gula delete.

Ar `[...slug]/route.ts` a `x-forwarded-for` theke sudhu prothom IP nao:
`const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || undefined;`

### 3.5 Rate limit — `src/lib/rate-limit.ts` (notun)

```bash
npm i @upstash/ratelimit @upstash/redis
```

Upstash (free tier) a Redis banao, `.env.local` a: `UPSTASH_REDIS_REST_URL=...` ar `UPSTASH_REDIS_REST_TOKEN=...`. Na thakle in-memory fallback (dev-er jonno; production a Upstash lagbe).

```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

const redis = process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null;
const limiters = new Map<string, Ratelimit>();
const memory = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** true = allowed, false = too many requests */
export async function rateLimit(key: string, name: string, limit: number, windowSec: number): Promise<boolean> {
  if (redis) {
    const id = `${name}:${limit}:${windowSec}`;
    let rl = limiters.get(id);
    if (!rl) {
      rl = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
        prefix: `rl:${name}`,
      });
      limiters.set(id, rl);
    }
    const { success } = await rl.limit(key);
    return success;
  }

  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
```

Use koro:

`api/auth/login/route.ts` — `const body = await req.json();` er age:

```ts
    const ip = getClientIp(req);
    if (!(await rateLimit(`ip:${ip}`, "login-ip", 20, 900))) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
```
Ar `validated` pass korar por: `if (!(await rateLimit(`em:${validated.data.email.toLowerCase()}`, "login-email", 5, 900))) return 429`.

`api/auth/register/route.ts` — ek-i vabe `register-ip`, 5 per hour.
`api/settings/test-sms/route.ts` — `rateLimit(`org:${orgId}`, "test-sms", 5, 3600)`.
Import: `import { rateLimit, getClientIp } from "@/lib/rate-limit";`

Password rule shokto koro — `validations/index.ts`: `RegisterSchema.password: z.string().min(10).max(72)`. Login schema `min(6)` rekhe dao (purono user der jonno).

### 3.6 Webhook auth — `src/app/api/webhooks/sms/[provider]/route.ts`

File er top a add:

```ts
import crypto from "crypto";

function safeEqual(a: string, b: string): boolean {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}
```

`POST` er suru te (`try {` er bhitore, prothom line) add:

```ts
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    const supplied =
      req.headers.get("x-webhook-secret") || new URL(req.url).searchParams.get("token") || "";
    if (!safeEqual(supplied, secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
```

ZendSMS dashboard a webhook URL set koro: `https://YOUR-DOMAIN/api/webhooks/sms/zendsms?token=<WEBHOOK_SECRET>`.
> ZendSMS docs check koro — jodi ora HMAC signature header dey, tahole oi signature verify koro (eta beshi safe). Ami exact header name jani na.

Extra: `.env.local` a `WEBHOOK_SECRET=` a lomba random value dao (Phase 0 er `randomBytes` command).

### 3.7 Double-send fix — atomic queue claim

`src/lib/services/delivery.service.ts` — `processBatch` **puro replace** (line 173-269):

```ts
  /**
   * Processes queued SMS jobs. Har job atomically "claim" hoy, tai 2 ta worker ek job 2 bar pathabe na.
   */
  static async processBatch(
    organizationId: string,
    limit = 50,
    campaignId?: string
  ): Promise<{ processed: number; sent: number; failed: number }> {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(organizationId);
    const provider = await getSmsProviderForOrg(organizationId);

    // Crash hoye "processing" a atke thaka job 10 min por retry-te pathao
    await DeliveryJobModel.updateMany(
      {
        organizationId: orgObjId,
        status: "processing",
        lastAttemptAt: { $lt: new Date(Date.now() - 10 * 60 * 1000) },
      },
      { $set: { status: "pending_retry" } }
    );

    let processed = 0;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < limit; i++) {
      const job = await DeliveryJobModel.findOneAndUpdate(
        {
          organizationId: orgObjId,
          ...(campaignId ? { campaignId: new mongoose.Types.ObjectId(campaignId) } : {}),
          status: { $in: ["queued", "retrying", "pending_retry"] },
          $or: [{ nextRetryAt: { $exists: false } }, { nextRetryAt: null }, { nextRetryAt: { $lte: new Date() } }],
        },
        { $set: { status: "processing", lastAttemptAt: new Date() }, $inc: { attempts: 1 } },
        { sort: { createdAt: 1 }, new: true }
      );
      if (!job) break;
      processed++;

      let result: Awaited<ReturnType<typeof provider.sendSms>>;
      try {
        result = await provider.sendSms({ to: job.phone, message: job.message, senderId: job.senderId });
      } catch (e: any) {
        result = { success: false, provider: provider.name, error: e?.message || "provider_error" } as any;
      }

      if (result.success) {
        job.status = "sent";
        job.providerMessageId = result.providerMessageId;
        sent++;

        await CampaignRecipientModel.updateOne(
          { organizationId: orgObjId, campaignId: job.campaignId, recipientId: job.recipientId },
          { $set: { deliveryStatus: "sent", providerMessageId: result.providerMessageId, sentAt: new Date() } }
        );
        await CampaignModel.updateOne(
          { _id: job.campaignId },
          { $inc: { "statistics.sent": 1, "statistics.queued": -1 } }
        );
        await DeliveryEventModel.create({
          organizationId: orgObjId,
          campaignId: job.campaignId,
          recipientId: job.recipientId,
          trackingId: job.trackingId,
          provider: provider.name,
          providerMessageId: result.providerMessageId || "N/A",
          eventType: "sent",
          payload: result.rawResponse || {},
        });
      } else if (job.attempts < job.maxAttempts) {
        job.status = "pending_retry";
        job.errorMessage = result.error;
        job.nextRetryAt = new Date(Date.now() + Math.pow(2, job.attempts) * 60000);
      } else {
        job.status = "failed";
        job.errorMessage = result.error;
        failed++;
        await CampaignModel.updateOne(
          { _id: job.campaignId },
          { $inc: { "statistics.failed": 1, "statistics.queued": -1 } }
        );
      }

      await job.save();
    }

    return { processed, sent, failed };
  }
```

`src/lib/queue/index.ts` — `queueSmsBatch` er else-branch a campaignId pass koro:
`await DeliveryService.processBatch(organizationId, 100, campaignId);`

`src/app/api/campaigns/[id]/send/route.ts` — puro replace (double dispatch + re-send + wrong campaign fix). Wallet (Phase 4) baki:

```ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { withTenant } from "@/lib/auth/guard";
import { CampaignModel } from "@/lib/db/models";
import { queueSmsBatch } from "@/lib/queue";
import { connectToDatabase } from "@/lib/db/connect";

const SENDABLE = ["draft", "scheduled", "queued", "paused"];

export const POST = withTenant(async (_req, { orgId, params }) => {
  try {
    const { id } = params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await connectToDatabase();
    // atomic: ek-i request "sending" a nite parbe
    const campaign = await CampaignModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        organizationId: new mongoose.Types.ObjectId(orgId),
        status: { $in: SENDABLE },
      },
      { $set: { status: "sending" } },
      { new: true }
    );

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found or already sending/completed" }, { status: 409 });
    }

    await queueSmsBatch(orgId, id);
    return NextResponse.json({ success: true, message: "Campaign queued for delivery" });
  } catch (err) {
    console.error("[Campaign Send API] Error:", err);
    return NextResponse.json({ error: "Failed to dispatch campaign" }, { status: 500 });
  }
}, "campaigns:send");
```

`api/delivery-queue/process/route.ts` a `limit` clamp: `const limit = Math.min(200, Math.max(1, Number(body.limit) || 50));`

### 3.8 Real worker — `scripts/worker.ts` (notun, `npm run worker` er file ta chilo na)

Serverless (Vercel) a `setTimeout` fallback bharosa-joggo na. Redis (Upstash/Railway) ar ekta alada server (Railway / Fly.io / VPS) a ei worker chalao:

```ts
import { Worker } from "bullmq";
import Redis from "ioredis";
import { DeliveryService } from "../src/lib/services/delivery.service";

const url = process.env.REDIS_URL;
if (!url) throw new Error("REDIS_URL is required for the worker");

const connection = new Redis(url, { maxRetriesPerRequest: null });

new Worker(
  "sms-delivery",
  async (job) => {
    const { organizationId, campaignId } = job.data as { organizationId: string; campaignId: string };
    let batch;
    do {
      batch = await DeliveryService.processBatch(organizationId, 100, campaignId);
    } while (batch.processed > 0);
  },
  { connection, concurrency: 2 }
);

console.log("[Worker] sms-delivery worker started");
```

Run: `npm run worker`.

---

## PHASE 4 — Wallet, SMS OTP signup, Super Admin

### 4.1 Wallet / credit system

**a) Organization model** (`models/Organization.ts`) — interface a `creditBalance: number;`, schema a:

```ts
    creditBalance: { type: Number, default: 0, min: 0 },
```

**b)** `src/lib/db/models/WalletTransaction.ts` (notun) + `models/index.ts` a export line add koro (onno line gular moto):

```ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWalletTransaction extends Document {
  organizationId: mongoose.Types.ObjectId;
  type: "credit" | "debit" | "refund" | "adjustment";
  amount: number; // sob shomoy positive
  balanceAfter: number;
  reason: string;
  campaignId?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    type: { type: String, enum: ["credit", "debit", "refund", "adjustment"], required: true },
    amount: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true },
    reason: { type: String, required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
WalletTransactionSchema.index({ organizationId: 1, createdAt: -1 });

export const WalletTransactionModel: Model<IWalletTransaction> =
  mongoose.models.WalletTransaction ||
  mongoose.model<IWalletTransaction>("WalletTransaction", WalletTransactionSchema);
```

**c)** `DeliveryJob` model a `charged: { type: Boolean, default: false }` field add koro (interface a `charged?: boolean`).

**d)** `src/lib/services/wallet.service.ts` (notun):

```ts
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { OrganizationModel, WalletTransactionModel } from "@/lib/db/models";

export class WalletService {
  /** Atomic: balance kom hole null/false, kom na hole kete nei. Negative hobe na. */
  static async debit(orgId: string, amount: number, meta: { reason: string; campaignId?: string; userId?: string }) {
    if (amount <= 0) return { ok: true as const, balance: null };
    await connectToDatabase();
    const org = await OrganizationModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(orgId), creditBalance: { $gte: amount } },
      { $inc: { creditBalance: -amount } },
      { new: true }
    );
    if (!org) return { ok: false as const };
    await WalletTransactionModel.create({
      organizationId: org._id,
      type: "debit",
      amount,
      balanceAfter: org.creditBalance,
      reason: meta.reason,
      campaignId: meta.campaignId,
      createdBy: meta.userId,
    });
    return { ok: true as const, balance: org.creditBalance };
  }

  static async credit(
    orgId: string,
    amount: number,
    type: "credit" | "refund" | "adjustment",
    meta: { reason: string; campaignId?: string; userId?: string }
  ) {
    await connectToDatabase();
    const org = await OrganizationModel.findByIdAndUpdate(
      new mongoose.Types.ObjectId(orgId),
      { $inc: { creditBalance: amount } },
      { new: true }
    );
    if (!org) return null;
    await WalletTransactionModel.create({
      organizationId: org._id,
      type,
      amount,
      balanceAfter: org.creditBalance,
      reason: meta.reason,
      campaignId: meta.campaignId,
      createdBy: meta.userId,
    });
    return org.creditBalance;
  }
}
```

**e) `providers/index.ts`** a Phase 1.4 er throw ta soriye platform fallback ferot dao (ekhon wallet paharay achhe):

```ts
  if (!cred) return getPlatformProvider();
```

**f) Send route** (3.7 er file) — `campaign` claim korar **age** credit kaTo (tenant nijer gateway use korle debit nai):

```ts
import { DeliveryJobModel } from "@/lib/db/models";
import { orgHasOwnGateway } from "@/lib/providers";
import { WalletService } from "@/lib/services/wallet.service";

    // ... campaign findOneAndUpdate er por:
    const usesPlatform = !(await orgHasOwnGateway(orgId));
    if (usesPlatform) {
      const jobFilter = {
        organizationId: new mongoose.Types.ObjectId(orgId),
        campaignId: campaign._id,
        status: { $in: ["queued", "retrying", "pending_retry"] },
        charged: { $ne: true },
      };
      const pending = await DeliveryJobModel.countDocuments(jobFilter);
      const debit = await WalletService.debit(orgId, pending, {
        reason: `Campaign "${campaign.name}" dispatch`,
        campaignId: id,
      });
      if (!debit.ok) {
        await CampaignModel.updateOne({ _id: campaign._id }, { $set: { status: "paused" } });
        return NextResponse.json({ error: "Insufficient credits", required: pending }, { status: 402 });
      }
      await DeliveryJobModel.updateMany(jobFilter, { $set: { charged: true } });
    }
```

`processBatch` er final-failed branch a refund add koro:

```ts
        if (job.charged) await WalletService.credit(organizationId, 1, "refund", { reason: "Failed SMS refund", campaignId: String(job.campaignId) });
```

**g)** Signup a free trial credits: register route er `OrganizationModel.create({...})` a `creditBalance: 20,` add koro.

### 4.2 SMS OTP signup

**a)** `src/lib/db/models/OtpCode.ts` (notun) + `models/index.ts` a export:

```ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOtpCode extends Document {
  phone: string;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
}

const OtpCodeSchema = new Schema<IOtpCode>(
  {
    phone: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);
OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto delete

export const OtpCodeModel: Model<IOtpCode> =
  mongoose.models.OtpCode || mongoose.model<IOtpCode>("OtpCode", OtpCodeSchema);
```

**b)** `src/app/api/auth/otp/send/route.ts` (notun):

```ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { OtpCodeModel, UserModel } from "@/lib/db/models";
import { getSmsProviderForOrg } from "@/lib/providers";
import { normalizePhoneNumber } from "@/lib/utils";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const Schema = z.object({ phone: z.string().min(8).max(20) });

export function hashOtp(phone: string, code: string): string {
  return crypto.createHmac("sha256", process.env.AUTH_SECRET!).update(`${phone}:${code}`).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid phone" }, { status: 400 });

    const { normalized, isValid } = normalizePhoneNumber(parsed.data.phone);
    if (!isValid) return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });

    const ip = getClientIp(req);
    if (
      !(await rateLimit(`ip:${ip}`, "otp-ip", 10, 3600)) ||
      !(await rateLimit(`ph:${normalized}`, "otp-phone", 3, 3600))
    ) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    await connectToDatabase();
    // Already registered hole o ekei response dei (phone enumerate thekano)
    const exists = await UserModel.exists({ phone: normalized });
    if (!exists) {
      const code = crypto.randomInt(100000, 1000000).toString();
      await OtpCodeModel.deleteMany({ phone: normalized });
      await OtpCodeModel.create({
        phone: normalized,
        codeHash: hashOtp(normalized, code),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      const provider = await getSmsProviderForOrg(); // platform gateway
      const res = await provider.sendSms({
        to: normalized,
        message: `Your SMSPro verification code is ${code}. It expires in 5 minutes.`,
      });
      if (!res.success) {
        console.error("[OTP] send failed:", res.error);
        return NextResponse.json({ error: "Could not send SMS. Try again." }, { status: 502 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[OTP send] error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

> Next.js route file theke `hashOtp` export korle build error dey (route file a sudhu HTTP method export kora jay). `hashOtp` ke `src/lib/auth/otp.ts` file a niye jao ar duita route theke import koro.

**c)** `src/app/api/auth/otp/verify/route.ts` (notun):

```ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { OtpCodeModel } from "@/lib/db/models";
import { signPhoneToken } from "@/lib/auth";
import { hashOtp } from "@/lib/auth/otp";
import { normalizePhoneNumber } from "@/lib/utils";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const Schema = z.object({ phone: z.string().min(8).max(20), code: z.string().regex(/^\d{6}$/) });

export async function POST(req: NextRequest) {
  try {
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    if (!(await rateLimit(`ip:${getClientIp(req)}`, "otp-verify", 20, 900))) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    const { normalized } = normalizePhoneNumber(parsed.data.phone);
    await connectToDatabase();

    const otp = await OtpCodeModel.findOne({ phone: normalized });
    if (!otp || otp.expiresAt < new Date() || otp.attempts >= 5) {
      return NextResponse.json({ error: "Code expired or invalid" }, { status: 400 });
    }

    const expected = Buffer.from(otp.codeHash);
    const actual = Buffer.from(hashOtp(normalized, parsed.data.code));
    const ok = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);

    if (!ok) {
      await OtpCodeModel.updateOne({ _id: otp._id }, { $inc: { attempts: 1 } });
      return NextResponse.json({ error: "Code expired or invalid" }, { status: 400 });
    }

    await OtpCodeModel.deleteOne({ _id: otp._id });
    return NextResponse.json({ success: true, phoneToken: await signPhoneToken(normalized) });
  } catch (err) {
    console.error("[OTP verify] error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

`src/lib/auth/otp.ts`:

```ts
import crypto from "crypto";

export function hashOtp(phone: string, code: string): string {
  return crypto.createHmac("sha256", process.env.AUTH_SECRET!).update(`${phone}:${code}`).digest("hex");
}
```
(ar `otp/send/route.ts` theke `hashOtp` function er definition delete kore `import { hashOtp } from "@/lib/auth/otp";` koro.)

**d) Register API te phone token mandatory** — `validations/index.ts`:

```ts
export const RegisterSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(10).max(72),
  organizationName: z.string().min(2).max(100),
  phoneToken: z.string().min(20),
});
```

`register/route.ts` — validation er por, `connectToDatabase()` er por:

```ts
import { verifyPhoneToken } from "@/lib/auth";
// ...
    const phone = await verifyPhoneToken(validated.data.phoneToken);
    if (!phone) {
      return NextResponse.json({ error: "Phone verification expired. Please verify again." }, { status: 400 });
    }
```

`UserModel.create({...})` a `phone,` add koro. Email/phone duplicate check er error message ekoi rakho: `"Could not create account"` (enumeration bondho).
`existingUser` check a phone o: `UserModel.findOne({ $or: [{ email }, { phone }] })`.

**e) `src/app/register/page.tsx`** a 2-step UI: prothome phone → "Send code" → 6-digit code → verified hole form. Handler gula:

```tsx
const [phone, setPhone] = useState("");
const [code, setCode] = useState("");
const [codeSent, setCodeSent] = useState(false);
const [phoneToken, setPhoneToken] = useState("");

async function sendOtp() {
  const res = await fetch("/api/auth/otp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const data = await res.json();
  if (res.ok) { setCodeSent(true); toast.success("Code sent"); } else toast.error(data.error || "Failed");
}

async function verifyOtp() {
  const res = await fetch("/api/auth/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code }),
  });
  const data = await res.json();
  if (res.ok) { setPhoneToken(data.phoneToken); toast.success("Phone verified"); } else toast.error(data.error || "Invalid code");
}
```

Existing `handleSubmit` er body te `phoneToken` add koro (`body: JSON.stringify({ name, email, password, organizationName, phoneToken })`), ar submit button `disabled={!phoneToken}` koro. JSX (form er suru te):

```tsx
<div className="space-y-2">
  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" disabled={!!phoneToken} className="w-full rounded-lg border px-3 py-2" />
  {!phoneToken && !codeSent && <button type="button" onClick={sendOtp} className="rounded-lg bg-blue-600 px-4 py-2 text-white">Send code</button>}
  {codeSent && !phoneToken && (
    <div className="flex gap-2">
      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" maxLength={6} className="w-full rounded-lg border px-3 py-2" />
      <button type="button" onClick={verifyOtp} className="rounded-lg bg-blue-600 px-4 py-2 text-white">Verify</button>
    </div>
  )}
  {phoneToken && <p className="text-sm text-green-600">✓ Phone verified</p>}
</div>
```
(Project er existing input/button style class diye replace kore nao.)

### 4.3 Super Admin panel

**a)** Nijer account ke superadmin banao — `scripts/make-superadmin.ts` (notun):

```ts
import mongoose from "mongoose";
import { UserModel } from "../src/lib/db/models";

async function main() {
  const email = process.argv[2]?.toLowerCase().trim();
  if (!email) throw new Error("Usage: make-superadmin.ts <email>");
  await mongoose.connect(process.env.MONGODB_URI!);
  const res = await UserModel.updateOne({ email }, { $set: { platformRole: "superadmin" } });
  console.log(res.matchedCount ? `OK: ${email} is now superadmin` : "User not found");
  await mongoose.disconnect();
}
main();
```

```bash
npx tsx --env-file=.env.local scripts/make-superadmin.ts you@example.com
```
Tarpor logout/login koro (notun JWT a `platformRole` dhukbe).

**b)** `src/app/api/admin/orgs/route.ts` (notun) — platform er shob tenant + usage:

```ts
import { NextResponse } from "next/server";
import { withSuperAdmin } from "@/lib/auth/guard";
import { connectToDatabase } from "@/lib/db/connect";
import { OrganizationModel, CampaignModel, MembershipModel } from "@/lib/db/models";

export const GET = withSuperAdmin(async () => {
  await connectToDatabase();
  const orgs = await OrganizationModel.find().sort({ createdAt: -1 }).limit(200).lean();
  const ids = orgs.map((o) => o._id);

  const [campaignStats, memberStats] = await Promise.all([
    CampaignModel.aggregate([
      { $match: { organizationId: { $in: ids } } },
      {
        $group: {
          _id: "$organizationId",
          campaigns: { $sum: 1 },
          sent: { $sum: "$statistics.sent" },
          delivered: { $sum: "$statistics.delivered" },
          failed: { $sum: "$statistics.failed" },
          clicks: { $sum: "$statistics.totalClicks" },
          lastCampaignAt: { $max: "$createdAt" },
        },
      },
    ]),
    MembershipModel.aggregate([
      { $match: { organizationId: { $in: ids } } },
      { $group: { _id: "$organizationId", members: { $sum: 1 } } },
    ]),
  ]);

  const cMap = new Map(campaignStats.map((c) => [String(c._id), c]));
  const mMap = new Map(memberStats.map((m) => [String(m._id), m.members]));

  const rows = orgs.map((o) => {
    const c = cMap.get(String(o._id));
    return {
      id: String(o._id),
      name: o.name,
      slug: o.slug,
      plan: o.plan,
      status: o.status,
      creditBalance: o.creditBalance ?? 0,
      createdAt: o.createdAt,
      members: mMap.get(String(o._id)) ?? 0,
      campaigns: c?.campaigns ?? 0,
      sent: c?.sent ?? 0,
      delivered: c?.delivered ?? 0,
      failed: c?.failed ?? 0,
      clicks: c?.clicks ?? 0,
      lastCampaignAt: c?.lastCampaignAt ?? null,
    };
  });

  const totals = rows.reduce(
    (t, r) => ({
      orgs: t.orgs + 1,
      active: t.active + (r.status === "active" ? 1 : 0),
      sent: t.sent + r.sent,
      clicks: t.clicks + r.clicks,
      credits: t.credits + r.creditBalance,
    }),
    { orgs: 0, active: 0, sent: 0, clicks: 0, credits: 0 }
  );

  return NextResponse.json({ totals, orgs: rows });
});
```

**c)** `src/app/api/admin/orgs/[id]/route.ts` (notun) — suspend / activate / credit add:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { withSuperAdmin } from "@/lib/auth/guard";
import { connectToDatabase } from "@/lib/db/connect";
import { OrganizationModel, AuditLogModel } from "@/lib/db/models";
import { WalletService } from "@/lib/services/wallet.service";

const Body = z.object({
  status: z.enum(["active", "suspended"]).optional(),
  plan: z.enum(["starter", "growth", "enterprise"]).optional(),
  addCredits: z.number().int().min(-1000000).max(1000000).optional(),
  reason: z.string().max(200).optional(),
});

export const PATCH = withSuperAdmin(async (req, { userId, params }) => {
  const { id } = params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  await connectToDatabase();
  const { status, plan, addCredits, reason } = parsed.data;

  const set: Record<string, unknown> = {};
  if (status) set.status = status;
  if (plan) set.plan = plan;
  if (Object.keys(set).length) await OrganizationModel.updateOne({ _id: id }, { $set: set });

  if (addCredits) {
    if (addCredits > 0) {
      await WalletService.credit(id, addCredits, "credit", { reason: reason || "Admin top-up", userId });
    } else {
      const res = await WalletService.debit(id, Math.abs(addCredits), { reason: reason || "Admin deduction", userId });
      if (!res.ok) return NextResponse.json({ error: "Insufficient credits to deduct" }, { status: 400 });
    }
  }

  // Audit trail (AuditLog model er field gula tomar schema onujayi mil kore nio)
  await AuditLogModel.create({
    organizationId: new mongoose.Types.ObjectId(id),
    userId: new mongoose.Types.ObjectId(userId),
    action: "admin.org.update",
    resource: "organization",
    resourceId: id,
    metadata: parsed.data,
  } as any);

  return NextResponse.json({ success: true });
});
```

> `AuditLogModel` er field name gula (`models/AuditLog.ts`) ekbar khule mil kore nio, `as any` ta tokhon soriye felo.

**d)** `src/app/admin/page.tsx` (notun) — Super Admin dashboard:

```tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";

interface OrgRow {
  id: string; name: string; slug: string; plan: string; status: "active" | "suspended";
  creditBalance: number; members: number; campaigns: number; sent: number; delivered: number;
  failed: number; clicks: number; createdAt: string; lastCampaignAt: string | null;
}
interface Totals { orgs: number; active: number; sent: number; clicks: number; credits: number }

export default function AdminPage() {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/orgs");
    if (res.ok) {
      const data = await res.json();
      setOrgs(data.orgs);
      setTotals(data.totals);
    } else {
      toast.error("Failed to load");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/orgs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) { toast.success("Updated"); load(); } else toast.error("Failed");
  }

  const filtered = orgs.filter((o) => o.name.toLowerCase().includes(q.toLowerCase()) || o.slug.includes(q.toLowerCase()));

  const kpis = totals && [
    { label: "Organizations", value: totals.orgs },
    { label: "Active", value: totals.active },
    { label: "SMS sent", value: totals.sent.toLocaleString() },
    { label: "Clicks", value: totals.clicks.toLocaleString() },
    { label: "Credits outstanding", value: totals.credits.toLocaleString() },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Super Admin</h1>
          <p className="text-sm text-slate-500">All organizations, usage and credits across the platform.</p>
        </div>

        {kpis && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-medium uppercase text-slate-500">{k.label}</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">{k.value}</div>
              </div>
            ))}
          </div>
        )}

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search organization…"
          className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                {["Organization", "Plan", "Status", "Members", "Campaigns", "Sent", "Delivered", "Clicks", "Credits", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-400">No organizations</td></tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {o.name}
                      <div className="text-xs font-normal text-slate-400">{o.slug}</div>
                    </td>
                    <td className="px-4 py-3 capitalize">{o.plan}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${o.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{o.members}</td>
                    <td className="px-4 py-3">{o.campaigns}</td>
                    <td className="px-4 py-3">{o.sent.toLocaleString()}</td>
                    <td className="px-4 py-3">{o.delivered.toLocaleString()}</td>
                    <td className="px-4 py-3">{o.clicks.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold">{o.creditBalance.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                          onClick={() => {
                            const v = window.prompt(`Add credits to ${o.name} (negative to deduct):`, "100");
                            const n = Number(v);
                            if (v && Number.isInteger(n) && n !== 0) patch(o.id, { addCredits: n });
                          }}
                        >
                          Credits
                        </button>
                        <button
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                          onClick={() => patch(o.id, { status: o.status === "active" ? "suspended" : "active" })}
                        >
                          {o.status === "active" ? "Suspend" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
```

Browser a `/admin` kholo (sudhu superadmin dhukte parbe; onno user `/dashboard` a redirect hobe).

---

## PHASE 5 — Cleanup

### 5.1 Unused vulnerable dependency

`xlsx` package tomar `src` a kothao import kora nai (sudhu UI text a ache), tai shorashori uninstall:

```bash
npm uninstall xlsx
```

Upload a `.xlsx` sotti support korte chaile pore `exceljs` install kore server-side parse koro (max file size + row limit soho).

Next/postcss advisory: `npm i next@latest react@latest react-dom@latest eslint-config-next@latest` → `npm run build` diye check koro (breaking change thakle changelog dekho).

### 5.2 Security headers — `next.config.ts` puro replace

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["mongoose", "bullmq", "ioredis", "bcryptjs"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### 5.3 Tenant isolation test — `tests/tenant-guard.test.ts` (notun)

```ts
import { describe, it, expect } from "vitest";
import { hasPermission } from "../src/lib/auth/rbac";

describe("RBAC", () => {
  it("viewer cannot delete or send campaigns", () => {
    expect(hasPermission("viewer", "campaigns:delete")).toBe(false);
    expect(hasPermission("viewer", "campaigns:send")).toBe(false);
  });
  it("viewer can read analytics", () => {
    expect(hasPermission("viewer", "analytics:read")).toBe(true);
  });
  it("owner can manage settings", () => {
    expect(hasPermission("owner", "settings:manage")).toBe(true);
  });
});
```

```bash
npm test
npm run typecheck
npm run build
```

### 5.4 Shesh checklist (deploy er age)

- [ ] `git grep 6700000000000000000000` → kichu nai
- [ ] `git grep -nE "sk_[a-z0-9]{20,}|mongodb\+srv://[^<]+:[^<]+@"` → kichu nai
- [ ] `curl.exe -i https://YOUR-DOMAIN/api/dashboard` → `401`
- [ ] `AUTH_SECRET`, `MONGODB_URI`, `ZENDSMS_API_KEY`, `WEBHOOK_SECRET` production env a set
- [ ] Notun account signup → OTP ashe → verify → dashboard (20 free credits)
- [ ] Credit 0 hole campaign send `402` dey
- [ ] Suspended org login / API a `403` dey
- [ ] Worker service chalu (`npm run worker`) ar Redis connected
- [ ] `npm run build` pass
