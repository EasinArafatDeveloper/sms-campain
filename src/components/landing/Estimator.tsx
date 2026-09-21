"use client";

import React, { useId, useState } from "react";
import { motion } from "framer-motion";
import { MousePointerClick, Send, ShoppingBag, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { BorderBeam, NumberTicker, Reveal } from "./fx";
import { SectionHead } from "./Features";

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  display,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  display: string;
}) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </label>
        <output htmlFor={id} className="rounded-lg bg-indigo-50 px-2.5 py-1 font-mono text-xs font-bold tabular-nums text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--p": `${pct}%` } as React.CSSProperties}
        className="range-fancy w-full cursor-pointer"
      />
    </div>
  );
}

const PRESETS = [
  { label: "Small shop", messages: 5000, click: 5, buy: 3, order: 1200, cost: 0.35 },
  { label: "Growing brand", messages: 25000, click: 7, buy: 5, order: 1800, cost: 0.35 },
  { label: "Big campaign", messages: 100000, click: 6, buy: 4, order: 2500, cost: 0.3 },
];

export function Estimator() {
  const [messages, setMessages] = useState(10000);
  const [clickRate, setClickRate] = useState(6); // % of messages that get a click
  const [buyRate, setBuyRate] = useState(4); // % of clickers that buy
  const [orderValue, setOrderValue] = useState(1500);
  const [costPerSms, setCostPerSms] = useState(0.35);

  const clicks = Math.round(messages * (clickRate / 100));
  const orders = Math.round(clicks * (buyRate / 100));
  const revenue = orders * orderValue;
  const cost = Math.round(messages * costPerSms);
  const ratio = cost > 0 ? revenue / cost : 0;
  const costShare = revenue > 0 ? Math.min(1, cost / revenue) : cost > 0 ? 1 : 0;

  const results = [
    { label: "Clicks", icon: MousePointerClick, tone: "text-blue-600 bg-blue-500/10 dark:text-blue-300", node: <NumberTicker value={clicks} /> },
    { label: "Orders", icon: ShoppingBag, tone: "text-fuchsia-600 bg-fuchsia-500/10 dark:text-fuchsia-300", node: <NumberTicker value={orders} /> },
    { label: "Revenue", icon: Wallet, tone: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-300", node: <NumberTicker value={revenue} prefix="৳" /> },
    { label: "SMS cost", icon: Send, tone: "text-amber-600 bg-amber-500/10 dark:text-amber-300", node: <NumberTicker value={cost} prefix="৳" /> },
  ];

  const apply = (p: (typeof PRESETS)[number]) => {
    setMessages(p.messages);
    setClickRate(p.click);
    setBuyRate(p.buy);
    setOrderValue(p.order);
    setCostPerSms(p.cost);
  };

  return (
    <section id="estimator" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead
          eyebrow="Estimator"
          title="Try your own numbers"
          body="Adjust the assumptions to match your business. These are illustrative estimates, not guarantees or averages from our customers."
        />

        <Reveal>
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl shadow-indigo-500/5 backdrop-blur dark:border-white/10 dark:bg-white/[0.03] sm:p-10">
            <BorderBeam />
            <span aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />

            <div className="relative mb-8 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Start from</span>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => apply(p)}
                  className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.97] dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-indigo-400/40 dark:hover:bg-indigo-500/10"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="relative grid gap-10 md:grid-cols-2">
              <div className="space-y-6">
                <Slider label="Messages sent" value={messages} onChange={setMessages} min={1000} max={200000} step={1000} display={messages.toLocaleString("en-US")} />
                <Slider label="Click rate" value={clickRate} onChange={setClickRate} min={1} max={30} step={1} display={`${clickRate}%`} />
                <Slider label="Clickers who buy" value={buyRate} onChange={setBuyRate} min={1} max={30} step={1} display={`${buyRate}%`} />
                <Slider label="Average order value" value={orderValue} onChange={setOrderValue} min={200} max={10000} step={100} display={`৳${orderValue.toLocaleString("en-US")}`} />
                <Slider label="Cost per SMS" value={costPerSms} onChange={setCostPerSms} min={0.1} max={1} step={0.05} display={`৳${costPerSms.toFixed(2)}`} />
              </div>

              <div className="flex flex-col gap-4">
                <dl className="grid grid-cols-2 gap-3">
                  {results.map((r) => (
                    <div key={r.label} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-900/60">
                      <dt className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span className={cn("flex h-6 w-6 items-center justify-center rounded-lg", r.tone)}>
                          <r.icon className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                        {r.label}
                      </dt>
                      <dd className="mt-2 font-display text-2xl font-extrabold text-slate-900 dark:text-white">{r.node}</dd>
                    </div>
                  ))}
                </dl>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-900/60" aria-hidden="true">
                  <p className="mb-3 text-xs font-medium text-slate-500 dark:text-slate-400">Revenue vs SMS cost</p>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <span className="w-14 text-[11px] font-semibold text-slate-500">Revenue</span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
                        <motion.div className="h-full origin-left rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" animate={{ scaleX: revenue > 0 ? 1 : 0 }} transition={{ duration: 0.5, ease: "easeOut" }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-14 text-[11px] font-semibold text-slate-500">SMS cost</span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
                        <motion.div className="h-full origin-left rounded-full bg-gradient-to-r from-amber-500 to-orange-400" animate={{ scaleX: costShare }} transition={{ duration: 0.5, ease: "easeOut" }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 p-5 text-white shadow-lg shadow-indigo-600/25">
                  <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
                  <p className="relative text-xs font-medium text-indigo-100">Revenue for every ৳1 spent on SMS</p>
                  <p className="relative mt-1 font-display text-4xl font-extrabold">
                    <NumberTicker value={ratio} decimals={1} prefix="৳" />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
