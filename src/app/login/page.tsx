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
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  Icon3DLightning,
  Icon3DCursor,
  Icon3DFlame,
} from "@/components/ui/Icons3D";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("omer@smspro.io");
  const [password, setPassword] = useState("password123");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail("omer@smspro.io");
    setPassword("password123");
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
              Trackable SMS Marketing <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Customer Engagement
              </span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Generate unique cryptographic short links for every recipient, log live click telemetry, and retarget high-intent buyers with 1-click.
            </p>
          </div>
        </div>

        {/* Feature Points Box with 3D Icons */}
        <div className="relative z-10 space-y-3 pt-6">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Icon3DCursor size={22} />
            </div>
            <div className="text-xs">
              <div className="font-bold text-white">Cryptographic 6-Digit Links</div>
              <div className="text-[11px] text-slate-400">Save character limits & keep cost to 1 SMS</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Icon3DFlame size={22} />
            </div>
            <div className="text-xs">
              <div className="font-bold text-white">Hot Buyer Intent Scoring</div>
              <div className="text-[11px] text-slate-400">Automatically isolate repeat clickers for VIP sales</div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 text-[11px] text-slate-500">
          © 2026 SMSPro Inc. Multi-Tenant Enterprise Gateway.
        </div>
      </div>

      {/* Right Login Form Container */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="max-w-md w-full space-y-6">
          {/* Header */}
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sign In to Your Workspace</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Enter your credentials below to access your campaigns and analytics.
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
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="name@company.com"
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* 1-Click Demo Helper */}
                <div
                  onClick={handleQuickDemo}
                  className="p-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100/70 dark:hover:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-800/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      1-Click Demo Account Preset
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 underline font-bold">Apply</span>
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 font-mono">
                    omer@smspro.io / password123 (Owner)
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex-col gap-3 pb-6">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold gap-2 text-xs py-2.5 shadow-lg shadow-blue-600/25 border-0"
                  isLoading={isLoading}
                >
                  <span>Sign In to SMSPro</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <div className="text-center text-slate-500 dark:text-slate-400 text-xs">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                    Create Free Workspace
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
