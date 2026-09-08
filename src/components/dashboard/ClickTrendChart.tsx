"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatNumber } from "@/lib/utils";

export interface ClickTrendChartProps {
  data: { date: string; totalClicks: number; uniqueClicks: number }[];
}

export function ClickTrendChart({ data }: ClickTrendChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="totalClicksGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="uniqueClicksGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={{ stroke: "#E2E8F0" }}
            tick={{ fill: "#64748B", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748B", fontSize: 12 }}
            tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0F172A",
              borderRadius: "0.5rem",
              border: "none",
              color: "#FFFFFF",
              fontSize: "12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
            }}
            formatter={(value: any, name: any) => [
              formatNumber(value),
              name === "totalClicks" ? "Total Clicks" : "Unique Clickers",
            ]}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs font-medium text-slate-600">
                {value === "totalClicks" ? "Total Clicks" : "Unique Clickers"}
              </span>
            )}
          />
          <Area
            type="monotone"
            dataKey="totalClicks"
            stroke="#2563EB"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#totalClicksGrad)"
          />
          <Area
            type="monotone"
            dataKey="uniqueClicks"
            stroke="#7C3AED"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#uniqueClicksGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
