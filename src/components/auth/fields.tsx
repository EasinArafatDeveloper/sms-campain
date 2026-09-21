"use client";

import React, { useId, useState } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type IconType = React.ComponentType<{ className?: string }>;

interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  icon?: IconType;
  error?: string;
  hint?: string;
  /** slot on the right inside the input (e.g. show/hide password) */
  right?: React.ReactNode;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, icon: Icon, error, hint, right, className, id, ...props },
  ref
) {
  const auto = useId();
  const inputId = id || auto;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <div className="group relative">
        {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500" />}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-12 w-full rounded-xl border bg-white text-base text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:outline-none focus:ring-4 dark:bg-slate-900/70 dark:text-white dark:placeholder:text-slate-500 sm:text-sm",
            Icon ? "pl-11" : "pl-4",
            right ? "pr-12" : "pr-4",
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15 dark:border-rose-500/60"
              : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/15 dark:border-white/10 dark:focus:border-indigo-400",
            className
          )}
          {...props}
        />
        {right && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

/* ---------------------------------------------------------- password field */

export function passwordScore(p: string): number {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

const STRENGTH_LABELS = ["Weak", "Okay", "Good", "Strong", "Very strong"];
const STRENGTH_COLORS = ["bg-rose-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500", "bg-emerald-500"];

interface PasswordFieldProps extends Omit<TextFieldProps, "icon" | "right" | "type"> {
  icon?: IconType;
  showStrength?: boolean;
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { showStrength, value, ...props },
  ref
) {
  const [visible, setVisible] = useState(false);
  const text = typeof value === "string" ? value : "";
  const score = passwordScore(text);
  const tooShort = text.length > 0 && text.length < 8;

  return (
    <div>
      <TextField
        ref={ref}
        {...props}
        value={value}
        type={visible ? "text" : "password"}
        right={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-white/10 dark:hover:text-slate-200"
          >
            {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        }
      />
      {showStrength && text.length > 0 && (
        <div className="mt-2.5" aria-live="polite">
          <div className="flex gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", !tooShort && i < Math.max(1, score) ? STRENGTH_COLORS[score] : "bg-slate-200 dark:bg-white/10")}
              />
            ))}
          </div>
          <p className={cn("mt-1.5 text-xs", tooShort ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400")}>
            {tooShort ? "Use at least 8 characters" : `Password strength: ${STRENGTH_LABELS[score]}`}
          </p>
        </div>
      )}
    </div>
  );
});

/* ------------------------------------------------------ alert + submit button */

export function AuthAlert({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 bg-[length:200%_auto] text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all duration-300 hover:bg-right hover:shadow-xl hover:shadow-indigo-600/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent motion-safe:animate-shimmer" />
      {loading ? (
        <>
          <Loader2 className="relative h-4 w-4 animate-spin" aria-hidden="true" />
          <span className="relative">Please wait…</span>
        </>
      ) : (
        <span className="relative inline-flex items-center gap-2">
          {children}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      )}
    </button>
  );
}
