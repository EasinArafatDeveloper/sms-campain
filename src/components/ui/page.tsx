"use client";

/**
 * Shared building blocks for the signed-in app pages, so every page has the same header, panels,
 * toolbars, tables and empty states as the dashboard.
 */
import React from "react";
import { AlertTriangle, CheckCircle2, Loader2, Search, Send, Trash2, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------- header */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

/* --------------------------------------------------------------- buttons */

const BTN =
  "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-slate-950";

export const btnPrimary = cn(
  BTN,
  "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/25 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-600/35"
);
export const btnSecondary = cn(
  BTN,
  "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/5"
);
export const btnDanger = cn(BTN, "bg-rose-600 text-white shadow-md shadow-rose-600/25 hover:bg-rose-700");

/** Small square icon button (table row actions). */
export const iconBtn =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white";

/* ----------------------------------------------------------------- panel */

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  flush,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** no inner padding (for tables) */
  flush?: boolean;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5">
          <div>
            {title && <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={cn(flush ? (title || actions ? "mt-4" : "") : "p-6")}>{children}</div>
    </section>
  );
}

/* ---------------------------------------------------------------- inputs */

export function SearchBox({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn("relative flex-1", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-900 dark:text-white"
      />
    </div>
  );
}

export function SelectBox({
  value,
  onChange,
  label,
  children,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className={cn(
        "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200",
        className
      )}
    >
      {children}
    </select>
  );
}

/** Row that holds a search box and filters. */
export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-center">{children}</div>;
}

/* ----------------------------------------------------------------- table */

export const tbl = {
  wrap: "overflow-x-auto",
  table: "w-full text-left text-sm",
  head: "border-y border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400",
  th: "px-4 py-3 first:pl-6 last:pr-6",
  body: "divide-y divide-slate-100 dark:divide-white/10",
  row: "transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]",
  td: "px-4 py-3.5 first:pl-6 last:pr-6 text-slate-700 dark:text-slate-200",
  mono: "font-mono text-[13px]",
};

/* ------------------------------------------------------------ empty state */

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <p className="mt-4 font-display text-base font-bold text-slate-900 dark:text-white">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------- alerts */

export function Notice({
  type,
  children,
  onClose,
}: {
  type: "success" | "error" | "info";
  children: React.ReactNode;
  onClose?: () => void;
}) {
  const tone =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
      : type === "error"
      ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
      : "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200";
  const Icon = type === "success" ? CheckCircle2 : AlertTriangle;
  return (
    <div role={type === "error" ? "alert" : "status"} className={cn("flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm", tone)}>
      <span className="flex items-start gap-2.5">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="font-medium">{children}</span>
      </span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss" className="shrink-0 opacity-60 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/* --------------------------------------------------------- delete dialog */

export function ConfirmDelete({
  name,
  loading,
  onCancel,
  onConfirm,
}: {
  name: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !loading && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading, onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={() => !loading && onCancel()}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900"
      >
        <div className="flex items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 id="delete-title" className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Delete this campaign?
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              <strong className="font-semibold text-slate-900 dark:text-white">{name}</strong> will be removed together with its recipients, tracking links and click history. This cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" onClick={onCancel} disabled={loading} className={btnSecondary}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className={btnDanger}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
            {loading ? "Deleting…" : "Delete campaign"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- send dialog */

export function ConfirmSend({
  name,
  recipientCount,
  loading,
  onCancel,
  onConfirm,
}: {
  name: string;
  recipientCount: number;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !loading && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading, onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={() => !loading && onCancel()}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="send-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900"
      >
        <div className="flex items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
            <Send className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 id="send-title" className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Send this campaign now?
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              <strong className="font-semibold text-slate-900 dark:text-white">{name}</strong> will be sent to{" "}
              <strong className="font-semibold text-slate-900 dark:text-white">{recipientCount.toLocaleString()}</strong> recipient
              {recipientCount === 1 ? "" : "s"}. This cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" onClick={onCancel} disabled={loading} className={btnSecondary}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className={btnPrimary}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            {loading ? "Sending…" : "Yes, send now"}
          </button>
        </div>
      </div>
    </div>
  );
}
