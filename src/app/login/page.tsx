"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BRAND } from "@/lib/brand";
import { AuthShell } from "@/components/auth/AuthShell";
import { ActivityFeed } from "@/components/auth/auth-visuals";
import { AuthAlert, PasswordField, SubmitButton, TextField } from "@/components/auth/fields";
import { GradientText } from "@/components/landing/fx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Only allow same-site relative paths, so `?callbackUrl=` can never redirect to another website. */
function safeCallback(): string {
  try {
    const raw = new URLSearchParams(window.location.search).get("callbackUrl");
    if (raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\")) return raw;
  } catch {
    /* ignore */
  }
  return "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const errs: { email?: string; password?: string } = {};
    if (!EMAIL_RE.test(email.trim())) errs.email = "Enter a valid email address";
    if (!password) errs.password = "Enter your password";
    setFieldErrors(errs);
    if (errs.email || errs.password) {
      document.getElementById(errs.email ? "login-email" : "login-password")?.focus();
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        // Refresh the shared auth context now, before navigating, so the header/sidebar
        // render the signed-in user immediately instead of a stale "logged out" state.
        await refreshUser();
        const explicit = new URLSearchParams(window.location.search).get("callbackUrl");
        // Super admins land on the admin console unless they were sent here from a specific page
        router.push(explicit ? safeCallback() : data.user?.platformRole === "superadmin" ? "/admin" : "/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Invalid email or password");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      headline={
        <>
          Welcome back. See who <GradientText tone="onDark">clicked</GradientText>
        </>
      }
      copy="Pick up where you left off: live delivery, real clicks and the hot leads waiting for a follow-up."
      visual={<ActivityFeed />}
      footnote={`© ${BRAND.year} ${BRAND.name}. All rights reserved.`}
    >
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Enter your details to open your {BRAND.name} workspace.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AuthAlert message={error} />

        <TextField
          id="login-email"
          label="Email address"
          icon={Mail}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />

        <PasswordField
          id="login-password"
          label="Password"
          icon={Lock}
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />

        <SubmitButton loading={isLoading}>Sign in</SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
        New to {BRAND.name}?{" "}
        <Link href="/register" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
          Create a free workspace
        </Link>
      </p>
    </AuthShell>
  );
}
