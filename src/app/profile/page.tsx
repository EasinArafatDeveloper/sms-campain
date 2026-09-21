"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  User,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Mail,
  Lock,
  Building2,
  Sparkles,
  Coins,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Send,
  Calendar,
  Globe,
  Radio,
} from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Edit State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // OTP Verification State
  const [verifyPhone, setVerifyPhone] = useState("");
  const [otpStep, setOtpStep] = useState<"input" | "code">("input");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
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

  // Countdown timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpStep === "code" && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpStep, countdown]);

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_profile",
          name,
          phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setProfileMessage({ type: "success", text: "Profile updated successfully!" });
      fetchProfile();
      setTimeout(() => setProfileMessage(null), 4000);
    } catch (err: any) {
      setProfileMessage({ type: "error", text: err.message || "Failed to update profile" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_password",
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setPasswordMessage({ type: "success", text: "Password changed successfully!" });
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

  // Send OTP
  const handleSendOtp = async () => {
    const targetPhone = verifyPhone || phone;
    if (!targetPhone || targetPhone.trim().length < 11) {
      setOtpMessage({ type: "error", text: "Please enter a valid Bangladesh mobile number (e.g. 017XXXXXXXX)" });
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
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to send verification code");
      }

      setOtpStep("code");
      setCountdown(60);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpMessage({ type: "success", text: `6-digit verification code sent to ${targetPhone}` });
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      setOtpMessage({ type: "error", text: err.message || "Failed to send code" });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = val.slice(-1);
    setOtpDigits(newDigits);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const fullCode = otpDigits.join("");
    if (fullCode.length !== 6) {
      setOtpMessage({ type: "error", text: "Please enter all 6 digits of the code" });
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
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setOtpMessage({
        type: "success",
        text: data.creditsAwarded
          ? "🎉 Success! Phone verified and 50 Free SMS Credits added to your workspace!"
          : "✅ Phone number verified successfully!",
      });

      setOtpStep("input");
      fetchProfile();
    } catch (err: any) {
      setOtpMessage({ type: "error", text: err.message || "Verification failed" });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const userInitials = profile?.name
    ? profile.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "US";

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              My Profile & Account Settings
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage your personal credentials, phone verification, and workspace privileges.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProfile}
              className="gap-1.5 text-xs text-slate-600 dark:text-slate-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* User Hero Banner */}
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 text-white shadow-lg overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-blue-600/20 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-white/20 flex items-center justify-center font-extrabold text-2xl shadow-xl">
                {userInitials}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-white">{profile?.name || "Loading..."}</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase">
                    {profile?.platformRole === "superadmin" ? "SuperAdmin" : "Workspace Owner"}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{profile?.email}</span>
                </div>
              </div>
            </div>

            {/* Quick Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-sm text-left">
                <div className="text-[10px] text-slate-400 font-medium">Workspace Credits</div>
                <div className="text-sm font-bold text-blue-400 flex items-center gap-1.5 mt-0.5">
                  <Coins className="w-4 h-4 text-blue-400" />
                  <span>{formatNumber(profile?.organization?.smsCredits || 0)} SMS</span>
                </div>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-sm text-left">
                <div className="text-[10px] text-slate-400 font-medium">Phone Verification</div>
                <div className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                  {profile?.isPhoneVerified ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> Verified
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <ShieldAlert className="w-4 h-4" /> Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Phone Verification & Profile Edit */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card 1: Phone Verification & 50 Free Credits */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold">Phone Verification (ZendSMS OTP)</CardTitle>
                      <CardDescription className="text-xs">
                        Verify your Bangladeshi mobile number to secure your account & receive trial credits
                      </CardDescription>
                    </div>
                  </div>
                  {profile?.isPhoneVerified ? (
                    <Badge variant="success" className="gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="gap-1 font-semibold">
                      <ShieldAlert className="w-3 h-3" /> Unverified
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-4">
                {otpMessage && (
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                      otpMessage.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                        : "bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
                    }`}
                  >
                    {otpMessage.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    )}
                    <span>{otpMessage.text}</span>
                  </div>
                )}

                {profile?.isPhoneVerified ? (
                  <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-emerald-900 dark:text-emerald-200">
                        Phone Number Verified: {profile.phone || "Active"}
                      </div>
                      <div className="text-emerald-700 dark:text-emerald-400">
                        Your mobile number is verified. You have full access to broadcast SMS campaigns and retarget active leads.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <div className="font-bold text-amber-900 dark:text-amber-200">
                          Verify Your Phone & Claim 50 Free Trial Credits
                        </div>
                        <div className="text-amber-700 dark:text-amber-400">
                          To prevent spam and activate your free SMS credits, please verify your mobile number. A 6-digit code will be sent via ZendSMS.
                        </div>
                      </div>
                    </div>

                    {otpStep === "input" ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Mobile Number (Bangladesh)
                          </label>
                          <div className="relative">
                            <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="tel"
                              value={verifyPhone}
                              onChange={(e) => setVerifyPhone(e.target.value)}
                              placeholder="017XXXXXXXX"
                              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-medium"
                            />
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="primary"
                          onClick={handleSendOtp}
                          isLoading={isSendingOtp}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs py-2.5 gap-2 shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Verification Code (SMS)</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-2">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Enter 6-Digit Code sent to {verifyPhone}
                            </label>
                            <button
                              type="button"
                              onClick={() => setOtpStep("input")}
                              className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                            >
                              Change Number
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
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                className="w-11 h-12 text-center text-lg font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            {countdown > 0 ? (
                              `Resend code in ${countdown}s`
                            ) : (
                              <button
                                type="button"
                                onClick={handleSendOtp}
                                className="text-blue-600 font-bold hover:underline"
                              >
                                Resend Code Now
                              </button>
                            )}
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant="primary"
                          onClick={handleVerifyOtp}
                          isLoading={isVerifyingOtp}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 gap-2 shadow-sm"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Verify Code & Unlock 50 Credits</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 2: Edit Profile Information */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Personal Information</CardTitle>
                    <CardDescription className="text-xs">Update your personal account details</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <form onSubmit={handleUpdateProfile}>
                <CardContent className="pt-6 space-y-4 text-xs">
                  {profileMessage && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        profileMessage.type === "success"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{profileMessage.text}</span>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={profile?.email || ""}
                      className="w-full px-3.5 py-2 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium"
                    />
                    <div className="text-[10px] text-slate-400 mt-1">Email address cannot be changed once registered.</div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Phone Number (Current)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </CardContent>

                <CardFooter className="justify-end border-t border-slate-100 dark:border-slate-800 py-4">
                  <Button type="submit" variant="primary" size="md" isLoading={isSavingProfile} className="text-xs">
                    Save Profile Changes
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Right Column: Security & Workspace Details */}
          <div className="lg:col-span-5 space-y-6">
            {/* Card 3: Security & Password */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Security & Password</CardTitle>
                    <CardDescription className="text-xs">Change your password to keep account secure</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <form onSubmit={handleChangePassword}>
                <CardContent className="pt-6 space-y-3.5 text-xs">
                  {passwordMessage && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        passwordMessage.type === "success"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{passwordMessage.text}</span>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </CardContent>

                <CardFooter className="justify-end border-t border-slate-100 dark:border-slate-800 py-3.5">
                  <Button type="submit" variant="primary" size="md" isLoading={isChangingPassword} className="text-xs">
                    Update Password
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Card 4: Workspace Information Overview */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Workspace Overview</CardTitle>
                    <CardDescription className="text-xs">Active SaaS tenant details</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-5 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Workspace Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {profile?.organization?.name || "My Workspace"}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Workspace Slug</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">
                    {profile?.organization?.slug || "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">SaaS Plan</span>
                  <Badge variant="default" className="capitalize">
                    {profile?.organization?.plan || "Growth"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">SMS Credits</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatNumber(profile?.organization?.smsCredits || 0)} Credits
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Default Sender ID</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {profile?.organization?.defaultSenderId || "8809612781020"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Member Since</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {profile?.createdAt ? formatDate(profile.createdAt) : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
