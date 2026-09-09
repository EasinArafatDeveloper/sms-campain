"use client";

import React from "react";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`relative inline-flex items-center gap-2 p-1.5 rounded-xl border transition-all duration-300 cursor-pointer shadow-sm ${
        isDark
          ? "bg-slate-900/90 border-slate-700/80 text-amber-300 hover:bg-slate-800 hover:border-slate-600 shadow-inner"
          : "bg-white border-slate-200 text-indigo-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
      } ${className}`}
      title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
    >
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
          isDark
            ? "bg-gradient-to-tr from-slate-800 to-indigo-950 text-amber-300 shadow-md border border-slate-700/50"
            : "bg-gradient-to-tr from-amber-50 to-orange-100 text-amber-600 shadow-sm border border-amber-200/50"
        }`}
      >
        {isDark ? (
          <Sun className="w-4 h-4 transition-transform duration-300 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 transition-transform duration-300 hover:-rotate-12" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold pr-2">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
