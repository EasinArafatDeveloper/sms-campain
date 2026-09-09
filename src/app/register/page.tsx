"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  Lock,
  Mail,
  User,
  Building,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  Icon3DLightning,
  Icon3DShield,
  Icon3DServer,
  Icon3DRocket,
  Icon3DUsers,
} from "@/components/ui/Icons3D";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, organizationName }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300">
      {/* Left Brand Panel (Desktop) */}
      <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-12 flex-col justify-between border-r border-slate-800 relative overflow-hidden text-white">
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 border border-white/20">
              <Icon3DLightning size={22} />
            </div>
            <span className="font-extrabold tracking-tight text-white text-lg">SMSPro SaaS</span>
          </Link>

          <div className="pt-8 space-y-4">
            <h2 className="text-3xl font-black tracking-tight text-white leading-tight">
              Start Your 14-Day <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Free SaaS Trial
              </span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Create your dedicated workspace, connect your BulkSMSBD credentials in Settings, and launch trackable SMS campaigns in minutes.
            </p>
          </div>
        </div>

        {/* Benefits List with 3D Icons */}
        <div className="relative z-10 space-y-3 pt-6">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Icon3DShield size={24} />
            </div>
            <div className="text-xs">
              <div className="font-bold text-white">Full Multi-Tenant Isolation</div>
              <div className="text-[11px] text-slate-400">Your customer data and API credentials are 100% private</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Icon3DServer size={24} />
            </div>
            <div className="text-xs">
              <div className="font-bold text-white">Bring Your Own SMS Gateway</div>
              <div className="text-[11px] text-slate-400">Configure BulkSMSBD, Greenweb, or custom API endpoints</div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 text-[11px] text-slate-500">
          No credit card required. Setup takes under 2 minutes.
        </div>
      </div>

      {/* Right Registration Form Container */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="max-w-md w-full space-y-6">
          {/* Header */}
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create Your Workspace</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Set up your organization account to start generating trackable SMS campaigns.
            </p>
          </div>

          <Card className="bg-white/95 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl">
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-6 text-xs">
                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-300 font-medium">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Company / Organization Name</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g. Apex E-Commerce Ltd"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Your Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g. Easin Arafat"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Work Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="easin@brand.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="At least 6 characters"
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex-col gap-3 pb-6">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold gap-2 text-xs py-2.5 shadow-lg shadow-blue-600/25 border-0 group"
                  isLoading={isLoading}
                >
                  <Icon3DRocket size={18} className="group-hover:scale-110 group-hover:rotate-6 transition-transform shrink-0" />
                  <span>Create Workspace & Start Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <div className="text-center text-slate-500 dark:text-slate-400 text-xs">
                  Already have an account?{" "}
                  <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                    Sign In
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
