"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building, Lock, Mail, User } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { AuthShell } from "@/components/auth/AuthShell";
import { SetupChecklist } from "@/components/auth/auth-visuals";
import { AuthAlert, PasswordField, SubmitButton, TextField } from "@/components/auth/fields";
import { GradientText } from "@/components/landing/fx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = Partial<Record<"organizationName" | "name" | "email" | "password", string>>;

/** Pulls the first readable message out of the API's zod "details" object. */
function firstDetail(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  for (const value of Object.values(details as Record<string, any>)) {
    const msg = value?._errors?.[0];
    if (typeof msg === "string") return msg;
  }
  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Same rules as the server (RegisterSchema), so people see the problem next to the field
    const next: Errors = {};
    if (organizationName.trim().length < 2) next.organizationName = "Enter your company or organization name";
    if (name.trim().length < 2) next.name = "Enter your full name";
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address";
    if (password.length < 8) next.password = "Password must be at least 8 characters";
    setErrors(next);

    const firstBad = (["organizationName", "name", "email", "password"] as const).find((k) => next[k]);
    if (firstBad) {
      document.getElementById(`register-${firstBad}`)?.focus();
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, organizationName }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(firstDetail(data.details) || data.error || "Registration failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create your account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      headline={
        <>
          Send your first <GradientText tone="onDark">tracked campaign</GradientText> today
        </>
      }
      copy="Create a workspace, verify your phone number and start with 50 free credits. See who clicks from your very first message."
      visual={<SetupChecklist />}
      footnote="No credit card required."
    >
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Create your workspace</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Free to start. Set up takes about a minute.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AuthAlert message={error} />

        <TextField
          id="register-organizationName"
          label="Company or organization"
          icon={Building}
          type="text"
          autoComplete="organization"
          placeholder="e.g. Apex E-Commerce Ltd"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          error={errors.organizationName}
        />

        <TextField
          id="register-name"
          label="Your full name"
          icon={User}
          type="text"
          autoComplete="name"
          placeholder="e.g. Easin Arafat"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <TextField
          id="register-email"
          label="Work email"
          icon={Mail}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <PasswordField
          id="register-password"
          label="Password"
          icon={Lock}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint={password ? undefined : "Use 8 or more characters. A longer password is safer."}
          showStrength
        />

        <SubmitButton loading={isLoading}>Create workspace</SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
