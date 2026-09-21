"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Notice, PageHeader, Panel, btnPrimary } from "@/components/ui/page";
import { PasswordField, TextField } from "@/components/auth/fields";
import { CheckCircle2, Coins, Loader2, Send, ShieldAlert, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";

type Msg = { type: "success" | "error"; text: string } | null;

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile edit
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<Msg>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<Msg>(null);

  // OTP verification
  const [verifyPhone, setVerifyPhone] = useState("");
  const [otpStep, setOtpStep] = useState<"input" | "code">("input");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState<Msg>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (res.ok && data.profile) {
        setProfile(data.profile);
        setName(data.profile.name || "");
        setPhone(data.profile.phone || "");
        setVerifyPhone(data.profile.phone || "");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpStep === "code" && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpStep, countdown]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_profile", name, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      setProfileMessage({ type: "success", text: "Profile updated." });
      fetchProfile();
      setTimeout(() => setProfileMessage(null), 4000);
    } catch (err: any) {
      setProfileMessage({ type: "error", text: err.message || "Failed to update profile" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "The new passwords do not match." });
      return;
    }
    setIsChangingPassword(true);
    setPasswordMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_password", currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      setPasswordMessage({ type: "success", text: "Password changed." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMessage(null), 4000);
    } catch (err: any) {
      setPasswordMessage({ type: "error", text: err.message || "Failed to change password" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSendOtp = async () => {
    const targetPhone = verifyPhone || phone;
    if (!targetPhone || targetPhone.trim().length < 11) {
      setOtpMessage({ type: "error", text: "Enter a valid Bangladesh mobile number, e.g. 017XXXXXXXX." });
      return;
    }
    setIsSendingOtp(true);
    setOtpMessage(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: targetPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to send the code");
      setOtpStep("code");
      setCountdown(60);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpMessage({ type: "success", text: `We sent a 6-digit code to ${targetPhone}.` });
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      setOtpMessage({ type: "error", text: err.message || "Failed to send the code" });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otpDigits];
    next[index] = val.slice(-1);
    setOtpDigits(next);
    if (val && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerifyOtp = async () => {
    const fullCode = otpDigits.join("");
    if (fullCode.length !== 6) {
      setOtpMessage({ type: "error", text: "Enter all 6 digits of the code." });
      return;
    }
    setIsVerifyingOtp(true);
    setOtpMessage(null);
    try {
      const targetPhone = verifyPhone || phone;
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: targetPhone, code: fullCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setOtpMessage({
        type: "success",
        text: data.creditsAwarded ? "Phone verified. 50 free SMS credits were added to your workspace." : "Phone number verified.",
      });
      setOtpStep("input");
      fetchProfile();
    } catch (err: any) {
      setOtpMessage({ type: "error", text: err.message || "Verification failed" });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  if (isLoading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-5xl space-y-6">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-28 rounded-2xl" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  const credits = profile?.organization?.smsCredits || 0;

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6 pb-8">
        <PageHeader title="Profile" subtitle="Your account details, phone verification and password." />

        {/* identity */}
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 font-display text-xl font-extrabold text-white shadow-lg shadow-indigo-600/25" aria-hidden="true">
              {initials || "•"}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold text-slate-900 dark:text-white">{profile?.name}</p>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">{profile?.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
              <Coins className="h-4 w-4" aria-hidden="true" />
              {formatNumber(credits)} credits
            </span>
            {profile?.isPhoneVerified ? (
              <Badge variant="success" className="gap-1 !px-3 !py-2 text-sm">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Phone verified
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1 !px-3 !py-2 text-sm">
                <ShieldAlert className="h-4 w-4" aria-hidden="true" /> Phone not verified
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* left column */}
          <div className="space-y-6">
            <Panel title="Phone verification" description={profile?.isPhoneVerified ? "Your number is confirmed" : "Confirm your number to unlock 50 free credits"}>
              <div className="space-y-4">
                {otpMessage && <Notice type={otpMessage.type} onClose={() => setOtpMessage(null)}>{otpMessage.text}</Notice>}

                {profile?.isPhoneVerified ? (
                  <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm dark:bg-emerald-500/10">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    <p className="text-emerald-800 dark:text-emerald-300">
                      <strong className="font-semibold">{profile.phone}</strong> is verified. You can send campaigns.
                    </p>
                  </div>
                ) : otpStep === "input" ? (
                  <>
                    <div className="flex items-start gap-3 rounded-xl bg-indigo-50 p-4 text-sm dark:bg-indigo-500/10">
                      <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
                      <p className="text-indigo-900 dark:text-indigo-200">We text you a 6-digit code. Enter it and 50 free SMS credits are added to your workspace.</p>
                    </div>
                    <TextField icon={Smartphone} label="Mobile number" type="tel" inputMode="tel" value={verifyPhone} onChange={(e) => setVerifyPhone(e.target.value)} placeholder="017XXXXXXXX" className="font-mono" />
                    <button type="button" onClick={handleSendOtp} disabled={isSendingOtp} className={`${btnPrimary} w-full`}>
                      {isSendingOtp ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                      Send code
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Code sent to {verifyPhone}</p>
                        <button type="button" onClick={() => setOtpStep("input")} className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-300">
                          Change number
                        </button>
                      </div>
                      <div className="flex justify-between gap-2">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => {
                              inputRefs.current[idx] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            autoComplete={idx === 0 ? "one-time-code" : "off"}
                            maxLength={1}
                            value={digit}
                            aria-label={`Digit ${idx + 1}`}
                            onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className="h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white text-center font-mono text-lg font-bold text-slate-900 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {countdown > 0 ? (
                        `You can ask for a new code in ${countdown}s`
                      ) : (
                        <button type="button" onClick={handleSendOtp} className="font-semibold text-indigo-600 hover:underline dark:text-indigo-300">
                          Send a new code
                        </button>
                      )}
                    </p>
                    <button type="button" onClick={handleVerifyOtp} disabled={isVerifyingOtp} className={`${btnPrimary} w-full`}>
                      {isVerifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                      Verify and claim 50 credits
                    </button>
                  </>
                )}
              </div>
            </Panel>

            <Panel title="Personal details">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {profileMessage && <Notice type={profileMessage.type} onClose={() => setProfileMessage(null)}>{profileMessage.text}</Notice>}
                <TextField label="Full name" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                <TextField label="Email" type="email" value={profile?.email || ""} disabled readOnly hint="Your email can't be changed." className="cursor-not-allowed bg-slate-50 text-slate-500 dark:bg-white/5" />
                <TextField label="Phone number" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="017XXXXXXXX" className="font-mono" autoComplete="tel" />
                <div className="flex justify-end">
                  <button type="submit" disabled={isSavingProfile} className={btnPrimary}>
                    {isSavingProfile && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    Save changes
                  </button>
                </div>
              </form>
            </Panel>
          </div>

          {/* right column */}
          <div className="space-y-6">
            <Panel title="Change password" description="Use at least 8 characters">
              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordMessage && <Notice type={passwordMessage.type} onClose={() => setPasswordMessage(null)}>{passwordMessage.text}</Notice>}
                <PasswordField label="Current password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
                <PasswordField label="New password" required showStrength minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
                <PasswordField label="Confirm new password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                <div className="flex justify-end">
                  <button type="submit" disabled={isChangingPassword} className={btnPrimary}>
                    {isChangingPassword && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    Update password
                  </button>
                </div>
              </form>
            </Panel>

            <Panel title="Workspace">
              <dl className="space-y-3.5 text-sm">
                {[
                  ["Name", profile?.organization?.name || "My Workspace"],
                  ["SMS credits", `${formatNumber(credits)}`],
                  ["Default sender ID", profile?.organization?.defaultSenderId || "8809612781020"],
                  ["Member since", profile?.createdAt ? formatDate(profile.createdAt) : "—"],
                ].map(([k, v], i) => (
                  <div key={k} className={`flex items-center justify-between gap-4 ${i > 0 ? "border-t border-slate-100 pt-3.5 dark:border-white/10" : ""}`}>
                    <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                    <dd className={`text-right font-semibold text-slate-900 dark:text-white ${k === "Default sender ID" ? "font-mono" : ""}`}>{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
