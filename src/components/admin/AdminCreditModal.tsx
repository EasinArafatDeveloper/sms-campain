"use client";

import React, { useState, useEffect } from "react";
import { Coins, X, Plus, Minus, Equal, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface AdminCreditModalProps {
  tenant: { _id: string; name: string; smsCredits: number } | null;
  onClose: () => void;
  onSubmit: (organizationId: string, amount: number, action: "add" | "deduct" | "set", reason: string, paymentRef?: string) => Promise<void>;
}

export function AdminCreditModal({
  tenant,
  onClose,
  onSubmit,
}: AdminCreditModalProps) {
  const [action, setAction] = useState<"add" | "deduct" | "set">("add");
  const [amount, setAmount] = useState<number>(100);
  const [reason, setReason] = useState<string>("Manual SuperAdmin Recharge");
  const [paymentRef, setPaymentRef] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!tenant) return null;

  const currentCredits = tenant.smsCredits || 0;
  let newCredits = currentCredits;
  if (action === "add") newCredits = currentCredits + (amount || 0);
  if (action === "deduct") newCredits = Math.max(0, currentCredits - (amount || 0));
  if (action === "set") newCredits = Math.max(0, amount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid non-negative credit amount");
      return;
    }

    if (action !== "set" && amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(tenant._id, amount, action, reason.trim() || "Manual Admin Adjustment", paymentRef.trim());
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update credits");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Adjust Workspace Credits</h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400">{tenant.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Type Selector */}
        <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setAction("add")}
            className={`py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
              action === "add"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
          <button
            type="button"
            onClick={() => setAction("deduct")}
            className={`py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
              action === "deduct"
                ? "bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Minus className="w-3.5 h-3.5" />
            <span>Deduct</span>
          </button>
          <button
            type="button"
            onClick={() => setAction("set")}
            className={`py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
              action === "set"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Equal className="w-3.5 h-3.5" />
            <span>Set Exact</span>
          </button>
        </div>

        {/* Balance Preview Card */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Current Balance</span>
            <div className="text-sm font-black text-slate-900 dark:text-white font-mono">
              {currentCredits.toLocaleString()}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <div className="text-right">
            <span className="text-slate-500 dark:text-slate-400">Calculated New Balance</span>
            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {newCredits.toLocaleString()} Credits
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {action === "set" ? "Exact Target Balance" : "Credit Amount"}
            </label>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            />
            {/* Quick Amounts */}
            <div className="flex items-center gap-1.5 mt-2">
              {[100, 500, 1000, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className="px-2 py-0.5 text-2xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason / Memo (Logged to Audit Trail)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. bKash payment, promotional bonus, support compensation"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Reference (Optional)
            </label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="e.g. bKash TrxID: 9X29A1098, Bank Invoice #102"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? "Updating..." : "Confirm Credit Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
