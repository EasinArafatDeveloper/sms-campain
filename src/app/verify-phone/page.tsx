"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Smartphone, ArrowRight, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

function VerifyPhoneContent() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get("phone") || "";

  const [phone, setPhone] = useState(initialPhone);
  const [step, setStep] = useState<"phone" | "otp">(initialPhone ? "otp" : "phone");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState<number>(60);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleSendOtp = async (targetPhone = phone) => {
    if (!targetPhone.trim()) {
      setErrorMsg("Please enter a valid phone number");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    setIsSending(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: targetPhone }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to send OTP");
      }

      setStep("otp");
      setCountdown(60);
      setSuccessMsg(`6-digit code sent to ${targetPhone}`);
      // Focus first digit box
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = val.slice(-1);
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const fullCode = otpDigits.join("");
    if (fullCode.length !== 6) {
      setErrorMsg("Please enter all 6 digits of the verification code");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setIsVerifying(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: fullCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setSuccessMsg("Phone number verified successfully! Redirecting...");
      await refreshUser(); // pull the updated isPhoneVerified/credits into the shared context
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-500/10">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-black tracking-tight text-white font-sans">
          Phone Verification
        </h2>
        <p className="mt-2 text-center text-xs text-slate-400">
          Verify your mobile number via ZendSMS to secure your workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 text-slate-100">
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === "phone" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mobile Number (BD)
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX or +88017XXXXXXXX"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <Button
                onClick={() => handleSendOtp()}
                isLoading={isSending}
                variant="primary"
                className="w-full py-2.5 justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              >
                <span>Send 6-Digit Code</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="text-center">
                <span className="text-xs text-slate-400">Enter the 6-digit code sent to</span>
                <div className="font-mono text-sm font-bold text-blue-400 mt-0.5">{phone}</div>
              </div>

              {/* 6-Digit OTP Box Grid */}
              <div className="flex justify-between gap-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-bold font-mono bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner"
                  />
                ))}
              </div>

              <Button
                onClick={handleVerifyOtp}
                isLoading={isVerifying}
                variant="primary"
                className="w-full py-2.5 justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/20"
              >
                <span>Verify & Continue</span>
                <CheckCircle2 className="w-4 h-4" />
              </Button>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Change phone number
                </button>

                {countdown > 0 ? (
                  <span className="text-slate-500 font-mono">Resend in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp(phone)}
                    disabled={isSending}
                    className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSending ? "animate-spin" : ""}`} />
                    <span>Resend Code</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPhonePage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
      <VerifyPhoneContent />
    </React.Suspense>
  );
}
