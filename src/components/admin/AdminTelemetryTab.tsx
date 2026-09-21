"use client";

import React from "react";
import { AdminStats } from "@/types/admin";
import {
  Server,
  Zap,
  Clock,
  ShieldCheck,
  Database,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Radio,
} from "lucide-react";

interface AdminTelemetryTabProps {
  stats: AdminStats | null;
  onRefresh: () => void;
  loading: boolean;
}

export function AdminTelemetryTab({
  stats,
  onRefresh,
  loading,
}: AdminTelemetryTabProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Telemetry Header */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>Live Platform Telemetry & Infrastructure Health</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time status of delivery gateways, background workers, distributed rate limiters, and security subsystems.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Grid of System Subsystems */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. ZendSMS Delivery Gateway Subsystem */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">ZendSMS Delivery Gateway</h4>
                <div className="text-2xs text-slate-500 dark:text-slate-400">Official Bangladesh Telecom Route</div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 text-2xs font-bold rounded-full flex items-center gap-1 ${
                stats?.gatewayHealthy
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${stats?.gatewayHealthy ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span>{stats?.gatewayHealthy ? "Operational" : "Degraded / Unchecked"}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-slate-500 dark:text-slate-400 font-semibold">Gateway Float Balance</div>
              <div className="text-base font-black text-slate-900 dark:text-white mt-1">
                {stats?.gatewayBalance !== null ? `৳${stats?.gatewayBalance?.toLocaleString()}` : "Unavailable"}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-slate-500 dark:text-slate-400 font-semibold">Success Delivery Rate</div>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {stats?.deliverySuccessRate}%
              </div>
            </div>
          </div>

          <div className="text-2xs text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Endpoint:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">https://api.zendsms.com/api/v1/send-sms</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Status Sync:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">Carrier DLR Webhooks Active</span>
            </div>
          </div>
        </div>

        {/* 2. Background Queue & Worker Subsystem */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Delivery Queue & Worker Loop</h4>
                <div className="text-2xs text-slate-500 dark:text-slate-400">Atomic Job Claim & Queue Pipeline</div>
              </div>
            </div>
            <span className="px-2 py-0.5 text-2xs font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-slate-500 dark:text-slate-400 font-semibold">Queue Backlog</div>
              <div className="text-base font-black text-slate-900 dark:text-white mt-1">
                {stats?.queueBacklog || 0} jobs
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-slate-500 dark:text-slate-400 font-semibold">Batch Concurrency</div>
              <div className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-1">
                50 SMS / batch
              </div>
            </div>
          </div>

          <div className="text-2xs text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Worker Script:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">scripts/worker.ts (Background Polling)</span>
            </div>
            <div className="flex justify-between">
              <span>Double-Dispatch Protection:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">Atomic DB Lock Enforced</span>
            </div>
          </div>
        </div>

        {/* 3. Rate Limiter Subsystem */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">API Rate Limiting Engine</h4>
                <div className="text-2xs text-slate-500 dark:text-slate-400">Brute-Force & Abuse Defense</div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 text-2xs font-bold rounded-full ${
                stats?.rateLimiterMode === "upstash_redis"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
              }`}
            >
              {stats?.rateLimiterMode === "upstash_redis" ? "Distributed Redis" : "In-Memory Sliding Window"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Active Mode:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {stats?.rateLimiterMode === "upstash_redis"
                  ? "Upstash Redis REST Pipeline"
                  : "Local Memory Store (Development)"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Serverless Scaling:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {stats?.rateLimiterMode === "upstash_redis" ? "Multi-Instance Ready" : "Single Instance / Local"}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Security & Authentication Guard */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Security & Tenant Isolation</h4>
                <div className="text-2xs text-slate-500 dark:text-slate-400">Cryptographic Tokens & RBAC</div>
              </div>
            </div>
            <span className="px-2 py-0.5 text-2xs font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              Active
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Session Protocol:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">JWT HS256 (Jose)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Webhook Auth:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">Fail-Closed (503 Guard)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Phone Verification:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">Salted HMAC SHA256</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
