export type AdminTab = "overview" | "tenants" | "users" | "telemetry" | "audit";

export interface AdminTenantOwner {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isPhoneVerified?: boolean;
}

export interface AdminTenant {
  _id: string;
  name: string;
  slug: string;
  plan: "starter" | "growth" | "enterprise";
  status: "active" | "suspended";
  smsCredits: number;
  defaultSenderId: string;
  trackingDomain?: string;
  createdAt: string;
  owner: AdminTenantOwner | null;
  memberCount: number;
  campaignCount: number;
  smsSent: number;
  totalClicks: number;
  lastActivityAt?: string;
}

export interface AdminTenantDetail extends AdminTenant {
  settings: {
    defaultTrackingLength: number;
    defaultTrackingFormat: "numeric" | "alphanumeric";
    retentionDays: number;
    enableWebhooks: boolean;
  };
  senderIds: string[];
  members: Array<{
    _id: string;
    userId: string;
    name: string;
    email: string;
    phone?: string;
    isPhoneVerified?: boolean;
    role: string;
    status: string;
    createdAt: string;
  }>;
  recentCampaigns: Array<{
    _id: string;
    name: string;
    status: string;
    totalRecipients: number;
    sent: number;
    delivered: number;
    clicks: number;
    createdAt: string;
  }>;
  creditHistory: Array<{
    _id: string;
    action: string;
    amount: number;
    previousCredits: number;
    newCredits: number;
    reason?: string;
    paymentRef?: string;
    adminEmail?: string;
    createdAt: string;
  }>;
  hasCustomApiKey: boolean;
  customSenderId?: string;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isPhoneVerified: boolean;
  role: "owner" | "admin";
  platformRole: "user" | "superadmin";
  status: "active" | "invited" | "disabled";
  createdAt: string;
  organization: {
    _id: string;
    name: string;
    slug: string;
    smsCredits: number;
    status: "active" | "suspended";
  } | null;
  stats: {
    campaignCount: number;
    smsSent: number;
  };
}

export interface AdminTimeseriesPoint {
  date: string;
  smsSent: number;
  delivered: number;
  signups: number;
  newWorkspaces: number;
}

export interface AdminAlerts {
  zeroCreditsCount: number;
  lowCreditsCount: number;
  unverifiedUsersCount: number;
  zeroCreditTenants: Array<{ _id: string; name: string; ownerEmail?: string; smsCredits: number }>;
  lowCreditTenants: Array<{ _id: string; name: string; ownerEmail?: string; smsCredits: number }>;
  unverifiedUsers: Array<{ _id: string; name: string; email: string; phone?: string }>;
}

export interface AdminStats {
  totalTenants: number;
  totalUsers: number;
  totalCampaigns: number;
  totalSmsSent: number;
  totalSmsDelivered: number;
  totalSmsFailed: number;
  deliverySuccessRate: number;
  totalClicks: number;
  recentSignups: number;
  gatewayBalance: number | null;
  gatewayCurrency: string;
  gatewayHealthy: boolean;
  timeseries: AdminTimeseriesPoint[];
  alerts: AdminAlerts;
  queueBacklog: number;
  rateLimiterMode: "upstash_redis" | "in_memory";
}

export interface AdminAuditLog {
  _id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  userName: string;
  userEmail: string;
  organizationName: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface AdminBulkActionPayload {
  target: "tenants" | "users";
  action: "activate" | "suspend" | "add_credits" | "change_plan";
  ids: string[];
  amount?: number;
  reason?: string;
  paymentRef?: string;
  plan?: "starter" | "growth" | "enterprise";
}
