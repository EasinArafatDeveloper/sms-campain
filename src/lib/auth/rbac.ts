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
    "*",
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
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission) || permissions.includes("*");
}
