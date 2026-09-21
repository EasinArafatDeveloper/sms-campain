"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  AdminTab,
  AdminStats,
  AdminTenant,
  AdminUser,
  AdminAuditLog,
} from "@/types/admin";
import {
  ShieldAlert,
  Building2,
  Users,
  Radio,
  FileText,
  LayoutDashboard,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

// SuperAdmin Modular Components
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminTenantsTable } from "@/components/admin/AdminTenantsTable";
import { AdminTenantDrawer } from "@/components/admin/AdminTenantDrawer";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { AdminTelemetryTab } from "@/components/admin/AdminTelemetryTab";
import { AdminAuditTab } from "@/components/admin/AdminAuditTab";
import { AdminCreditModal } from "@/components/admin/AdminCreditModal";
import { AdminConfirmModal } from "@/components/admin/AdminConfirmModal";

function SuperAdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state synchronization
  const initialTab = (searchParams.get("tab") as AdminTab) || "overview";
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  // Global SuperAdmin Data State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string>("");
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Tenants Data State
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [tenantsTotal, setTenantsTotal] = useState(0);
  const [tenantsPage, setTenantsPage] = useState(1);
  const [tenantsLimit] = useState(15);
  const [tenantsTotalPages, setTenantsTotalPages] = useState(1);
  const [tenantSearch, setTenantSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [creditAlertFilter, setCreditAlertFilter] = useState("all");
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [isTenantsLoading, setIsTenantsLoading] = useState(false);

  // Users Data State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersLimit] = useState(20);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [userVerifiedFilter, setUserVerifiedFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  // Modal & Drawer State
  const [selectedTenantDrawerId, setSelectedTenantDrawerId] = useState<string | null>(null);
  const [creditModalTenant, setCreditModalTenant] = useState<{ _id: string; name: string; smsCredits: number } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive?: boolean;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    isDestructive: false,
    action: async () => {},
  });

  // Sync tab changes with URL query string
  const handleTabChange = (newTab: AdminTab, filter?: { key: string; value: string }) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);

    if (filter) {
      if (newTab === "tenants") {
        if (filter.key === "creditAlert") setCreditAlertFilter(filter.value);
        if (filter.key === "plan") setPlanFilter(filter.value);
        if (filter.key === "status") setStatusFilter(filter.value);
      } else if (newTab === "users") {
        if (filter.key === "verified") setUserVerifiedFilter(filter.value);
      }
    }

    router.replace(`/admin?${params.toString()}`, { scroll: false });
  };

  // 1. Fetch Platform Stats & Current User
  const loadStats = async () => {
    setIsStatsLoading(true);
    try {
      const [statsRes, meRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/auth/me"),
      ]);

      const statsData = await statsRes.json();
      const meData = await meRes.json();

      if (statsRes.ok) {
        setStats(statsData);
      } else {
        toast.error(statsData.error || "Failed to load platform stats");
      }

      if (meData?.user?.id) {
        setCurrentAdminId(meData.user.id);
      }
    } catch {
      toast.error("Failed to connect to admin backend");
    } finally {
      setIsStatsLoading(false);
    }
  };

  // 2. Fetch Tenants
  const loadTenants = async () => {
    setIsTenantsLoading(true);
    try {
      const params = new URLSearchParams({
        page: tenantsPage.toString(),
        limit: tenantsLimit.toString(),
        search: tenantSearch,
        plan: planFilter,
        status: statusFilter,
        creditAlert: creditAlertFilter,
      });

      const res = await fetch(`/api/admin/tenants?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.tenants) {
        setTenants(data.tenants);
        setTenantsTotal(data.total);
        setTenantsTotalPages(data.totalPages);
      } else {
        toast.error(data.error || "Failed to load tenants");
      }
    } catch {
      toast.error("Failed to fetch workspaces");
    } finally {
      setIsTenantsLoading(false);
    }
  };

  // 3. Fetch Users
  const loadUsers = async () => {
    setIsUsersLoading(true);
    try {
      const params = new URLSearchParams({
        page: usersPage.toString(),
        limit: usersLimit.toString(),
        search: userSearch,
      });

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();

      if (data.users) {
        let filtered = data.users;
        if (userVerifiedFilter === "verified") filtered = filtered.filter((u: any) => u.isPhoneVerified);
        if (userVerifiedFilter === "unverified") filtered = filtered.filter((u: any) => !u.isPhoneVerified);
        if (userStatusFilter !== "all") filtered = filtered.filter((u: any) => u.status === userStatusFilter);
        if (userRoleFilter === "superadmin") filtered = filtered.filter((u: any) => u.platformRole === "superadmin");
        else if (userRoleFilter !== "all") filtered = filtered.filter((u: any) => u.role === userRoleFilter);

        setUsers(filtered);
        setUsersTotal(data.total);
        setUsersTotalPages(data.totalPages);
      } else {
        toast.error(data.error || "Failed to load users");
      }
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setIsUsersLoading(false);
    }
  };

  // 4. Fetch Audit Logs
  const loadAuditLogs = async () => {
    setIsAuditLoading(true);
    try {
      const res = await fetch("/api/admin/audit-logs?limit=50");
      const data = await res.json();
      if (data.success && data.logs) {
        setAuditLogs(data.logs);
      } else {
        toast.error(data.error || "Failed to load audit logs");
      }
    } catch {
      toast.error("Failed to fetch audit trail");
    } finally {
      setIsAuditLoading(false);
    }
  };

  // Initial Load & Tab specific fetching
  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === "tenants") {
      loadTenants();
    } else if (activeTab === "users") {
      loadUsers();
    } else if (activeTab === "audit") {
      loadAuditLogs();
    }
  }, [
    activeTab,
    tenantsPage,
    tenantSearch,
    planFilter,
    statusFilter,
    creditAlertFilter,
    usersPage,
    userSearch,
    userVerifiedFilter,
    userStatusFilter,
    userRoleFilter,
  ]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // '/' to focus search input if not currently typing in an input
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Update Tenant properties
  const handleUpdateTenant = async (
    id: string,
    update: { plan?: string; status?: string; defaultSenderId?: string; name?: string }
  ) => {
    const res = await fetch("/api/admin/tenants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: id, ...update }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Update failed");
    loadTenants();
    loadStats();
  };

  // Update User properties
  const handleUpdateUser = async (
    userId: string,
    data: { status?: string; platformRole?: string }
  ) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...data }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || "User updated successfully");
        loadUsers();
        loadStats();
      } else {
        toast.error(result.error || "Update failed");
      }
    } catch {
      toast.error("Failed to connect to server");
    }
  };

  // Credit Adjustment
  const handleCreditSubmit = async (
    organizationId: string,
    amount: number,
    action: "add" | "deduct" | "set",
    reason: string,
    paymentRef?: string
  ) => {
    const res = await fetch("/api/admin/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, amount, action, reason, paymentRef }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update credits");
    toast.success(data.message || "Credits adjusted successfully");
    loadStats();
    loadTenants();
  };

  // Bulk Actions
  const handleTenantBulkAction = (action: "activate" | "suspend" | "add_credits" | "change_plan", amount?: number, plan?: any) => {
    setConfirmModal({
      isOpen: true,
      title: `Confirm Bulk ${action.toUpperCase()}`,
      message: `Are you sure you want to apply '${action}' to ${selectedTenantIds.length} selected workspace(s)?`,
      isDestructive: action === "suspend",
      action: async () => {
        try {
          const res = await fetch("/api/admin/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              target: "tenants",
              action,
              ids: selectedTenantIds,
              amount,
              plan,
            }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success(data.message || "Bulk action executed");
            setSelectedTenantIds([]);
            loadTenants();
            loadStats();
          } else {
            toast.error(data.error || "Bulk action failed");
          }
        } catch {
          toast.error("Server connection error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleUserBulkAction = (action: "activate" | "suspend") => {
    setConfirmModal({
      isOpen: true,
      title: `Confirm Bulk ${action === "activate" ? "Enable" : "Disable"}`,
      message: `Are you sure you want to ${action === "activate" ? "enable" : "disable"} ${selectedUserIds.length} selected user(s)?`,
      isDestructive: action === "suspend",
      action: async () => {
        try {
          const res = await fetch("/api/admin/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              target: "users",
              action,
              ids: selectedUserIds,
            }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success(data.message || "Bulk action executed");
            setSelectedUserIds([]);
            loadUsers();
            loadStats();
          } else {
            toast.error(data.error || "Bulk action failed");
          }
        } catch {
          toast.error("Server connection error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // CSV Export Trigger
  const handleExportCsv = (type: "tenants" | "users" | "audit-logs") => {
    window.open(`/api/admin/export?type=${type}`, "_blank");
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* SuperAdmin Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                SuperAdmin Platform Control
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Multi-tenant workspace operations, real-time gateway telemetry, wallet ledger, and global RBAC control.
            </p>
          </div>

          {/* Tab Navigation Pill Bar */}
          <div className="flex items-center p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              onClick={() => handleTabChange("overview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "overview"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => handleTabChange("tenants")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "tenants"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Tenants ({stats?.totalTenants ?? "..."})</span>
            </button>

            <button
              onClick={() => handleTabChange("users")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "users"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users ({stats?.totalUsers ?? "..."})</span>
            </button>

            <button
              onClick={() => handleTabChange("telemetry")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "telemetry"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Telemetry</span>
            </button>

            <button
              onClick={() => handleTabChange("audit")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "audit"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Log</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <AdminOverviewTab
            stats={stats}
            onNavigateTab={handleTabChange}
            onOpenCreditModal={setCreditModalTenant}
            onRefresh={loadStats}
          />
        )}

        {/* Tab 2: Tenants */}
        {activeTab === "tenants" && (
          <AdminTenantsTable
            tenants={tenants}
            total={tenantsTotal}
            page={tenantsPage}
            limit={tenantsLimit}
            totalPages={tenantsTotalPages}
            loading={isTenantsLoading}
            searchQuery={tenantSearch}
            planFilter={planFilter}
            statusFilter={statusFilter}
            creditAlertFilter={creditAlertFilter}
            selectedIds={selectedTenantIds}
            onSearchChange={setTenantSearch}
            onPlanFilterChange={setPlanFilter}
            onStatusFilterChange={setStatusFilter}
            onCreditAlertFilterChange={setCreditAlertFilter}
            onPageChange={setTenantsPage}
            onSelectTenant={(id) => setSelectedTenantDrawerId(id)}
            onToggleSelectId={(id) =>
              setSelectedTenantIds((prev) =>
                prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
              )
            }
            onSelectAllIds={() =>
              setSelectedTenantIds(
                selectedTenantIds.length === tenants.length ? [] : tenants.map((t) => t._id)
              )
            }
            onOpenCreditModal={setCreditModalTenant}
            onOpenConfirmModal={(action, title, message, isDestructive) =>
              setConfirmModal({ isOpen: true, title, message, isDestructive, action })
            }
            onBulkAction={handleTenantBulkAction}
            onExportCsv={() => handleExportCsv("tenants")}
          />
        )}

        {/* Tab 3: Users */}
        {activeTab === "users" && (
          <AdminUsersTable
            users={users}
            total={usersTotal}
            page={usersPage}
            limit={usersLimit}
            totalPages={usersTotalPages}
            loading={isUsersLoading}
            searchQuery={userSearch}
            verifiedFilter={userVerifiedFilter}
            statusFilter={userStatusFilter}
            roleFilter={userRoleFilter}
            selectedIds={selectedUserIds}
            currentAdminId={currentAdminId}
            onSearchChange={setUserSearch}
            onVerifiedFilterChange={setUserVerifiedFilter}
            onStatusFilterChange={setUserStatusFilter}
            onRoleFilterChange={setUserRoleFilter}
            onPageChange={setUsersPage}
            onToggleSelectId={(id) =>
              setSelectedUserIds((prev) =>
                prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
              )
            }
            onSelectAllIds={() =>
              setSelectedUserIds(
                selectedUserIds.length === users.length ? [] : users.map((u) => u._id)
              )
            }
            onUpdateUser={handleUpdateUser}
            onBulkAction={handleUserBulkAction}
            onExportCsv={() => handleExportCsv("users")}
          />
        )}

        {/* Tab 4: Telemetry */}
        {activeTab === "telemetry" && (
          <AdminTelemetryTab
            stats={stats}
            onRefresh={loadStats}
            loading={isStatsLoading}
          />
        )}

        {/* Tab 5: Audit Logs */}
        {activeTab === "audit" && (
          <AdminAuditTab
            logs={auditLogs}
            loading={isAuditLoading}
            onExportCsv={() => handleExportCsv("audit-logs")}
          />
        )}

        {/* Slide-Over Drawer for Selected Tenant */}
        <AdminTenantDrawer
          tenantId={selectedTenantDrawerId}
          onClose={() => setSelectedTenantDrawerId(null)}
          onOpenCreditModal={setCreditModalTenant}
          onUpdateTenant={handleUpdateTenant}
          onRefresh={() => {
            loadTenants();
            loadStats();
          }}
        />

        {/* Credit Top-up Modal */}
        <AdminCreditModal
          tenant={creditModalTenant}
          onClose={() => setCreditModalTenant(null)}
          onSubmit={handleCreditSubmit}
        />

        {/* Confirmation Modal */}
        <AdminConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          isDestructive={confirmModal.isDestructive}
          onConfirm={confirmModal.action}
          onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        />
      </div>
    </AppLayout>
  );
}

export default function SuperAdminPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
            Loading SuperAdmin Console...
          </div>
        </AppLayout>
      }
    >
      <SuperAdminPageContent />
    </Suspense>
  );
}
