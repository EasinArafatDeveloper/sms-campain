"use client";

import React, { useState } from "react";
import { Search, Bell, Calendar, ChevronDown, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";

export function TopHeader() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Search Input */}
      <div className="relative w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search campaigns, tracking IDs, contacts..."
          className="w-full pl-9 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 placeholder-slate-400"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Gateway Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>BulkSMSBD: Active</span>
        </div>

        {/* Date Filter Selector */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Last 30 Days</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </div>

        {/* Notifications Icon with popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 bg-blue-600 rounded-full absolute top-2 right-2 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-dropdown border border-slate-200 p-4 z-50 text-xs">
              <div className="font-semibold text-slate-900 mb-2 flex items-center justify-between">
                <span>Recent Notifications</span>
                <span className="text-[10px] text-blue-600 cursor-pointer">Mark all as read</span>
              </div>
              <div className="space-y-2.5">
                <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100">
                  <div className="font-medium text-blue-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>SMS Gateway Connected</span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    BulkSMSBD gateway is active and ready to broadcast campaigns.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            OS
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-900 leading-none">Omer Sharif</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Marketing Manager</div>
          </div>
        </div>
      </div>
    </header>
  );
}
