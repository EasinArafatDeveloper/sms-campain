import { UserRole } from "@/types";

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: [
    "campaigns:create",
    "campaigns:read",
    "campaigns:update",
    "campaigns:delete",
    "campaigns:send",
    "recipients:read",
    "recipients:import",
    "audiences:manage",
    "analytics:read",
    "reports:export",
    "settings:manage",
    "members:manage",
    "billing:manage",
  ],
  admin: [
    "campaigns:create",
    "campaigns:read",
    "campaigns:update",
    "campaigns:delete",
    "campaigns:send",
    "recipients:read",
    "recipients:import",
    "audiences:manage",
    "analytics:read",
    "reports:export",
    "settings:manage",
    "members:manage",
  ],
  manager: [
    "campaigns:create",
    "campaigns:read",
    "campaigns:update",
    "campaigns:send",
    "recipients:read",
    "recipients:import",
    "audiences:manage",
    "analytics:read",
    "reports:export",
  ],
  analyst: [
    "campaigns:read",
    "recipients:read",
    "audiences:read",
    "analytics:read",
    "reports:export",
  ],
  viewer: [
    "campaigns:read",
    "analytics:read",
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission) || permissions.includes("*");
}
