"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, Users, TrendingDown, Star,
  ArrowUpRight, ShoppingBag, UserPlus, Flag, CheckCircle2,
} from "lucide-react";

const STATS = [
  { label: "Revenue", value: "$12,480", change: "+18%", icon: DollarSign, color: "#3fb950" },
  { label: "Users",   value: "3,241",   change: "+12%", icon: Users,       color: "#79c0ff" },
  { label: "Refunds", value: "2.4%",    change: "-0.5%",icon: TrendingDown, color: "#ffa657" },
  { label: "Pro",     value: "148",     change: "+9%",  icon: Star,        color: "#f778ba" },
];

const ACTIVITY = [
  { type: "purchase", label: "sarah@co.io bought admin-block", amount: "$49", time: "2m ago" },
  { type: "signup",   label: "james@dev.io signed up",          time: "5m ago" },
  { type: "purchase", label: "alex@startup.io bought auth-block",amount: "$39", time: "11m ago" },
  { type: "signup",   label: "maria@saas.io signed up",          time: "22m ago" },
];

const BARS = [40, 65, 50, 80, 70, 90, 75];
const MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];

export function AdminPreview() {
  const [activeFlag, setActiveFlag] = useState(true);

  return (
    <div className="p-4 space-y-4 min-h-[460px]" style={{ background: "transparent" }}>
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-3 border space-y-2"
            style={{ background: "rgba(22,27,34,0.8)", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px]" style={{ color: "#6e7681" }}>{s.label}</span>
              <s.icon size={11} style={{ color: s.color }} />
            </div>
            <p className="text-sm font-bold" style={{ color: "#c9d1d9" }}>{s.value}</p>
            <span className="text-[10px]" style={{ color: s.change.startsWith("+") ? "#3fb950" : "#ffa657" }}>
              {s.change}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {/* Revenue chart */}
        <div
          className="col-span-3 rounded-xl p-4 border"
          style={{ background: "rgba(22,27,34,0.8)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold" style={{ color: "#c9d1d9" }}>Revenue / Month</p>
            <ArrowUpRight size={12} style={{ color: "#3fb950" }} />
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {BARS.map((h, i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 500, damping: 20 }}
                className="flex-1 rounded-t-sm"
                style={{
                  height: `${h}%`,
                  background: i === BARS.length - 1
                    ? "linear-gradient(to top, #6d28d9, #a78bfa)"
                    : "rgba(255,255,255,0.08)",
                  transformOrigin: "bottom",
                }}
              />
            ))}
          </div>
          <div className="flex gap-1.5 mt-1.5">
            {MONTHS.map((m) => (
              <span key={m} className="flex-1 text-center text-[8px]" style={{ color: "#3d444d" }}>{m}</span>
            ))}
          </div>
        </div>

        {/* Feature flag panel */}
        <div
          className="col-span-2 rounded-xl p-3 border space-y-3"
          style={{ background: "rgba(22,27,34,0.8)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-1.5">
            <Flag size={11} style={{ color: "#ffa657" }} />
            <p className="text-[11px] font-semibold" style={{ color: "#c9d1d9" }}>Feature Flags</p>
          </div>
          {[
            { key: "beta-dashboard", pct: 20, active: activeFlag },
            { key: "new-checkout",   pct: 100, active: true },
            { key: "ai-assist",      pct: 5,  active: false },
          ].map((f, i) => (
            <div key={f.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono" style={{ color: "#6e7681" }}>{f.key}</span>
                <button
                  onClick={() => i === 0 && setActiveFlag(!activeFlag)}
                  className="w-6 h-3 rounded-full transition-colors relative"
                  style={{ background: f.active ? "#6d28d9" : "rgba(255,255,255,0.1)" }}
                >
                  <div
                    className="absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all"
                    style={{ left: f.active ? "10px" : "2px" }}
                  />
                </button>
              </div>
              <div className="h-0.5 rounded-full w-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${f.pct}%`, background: f.active ? "#6d28d9" : "rgba(255,255,255,0.15)" }}
                />
              </div>
              <p className="text-[8px]" style={{ color: "#3d444d" }}>{f.pct}% rollout</p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity feed */}
      <div
        className="rounded-xl p-3 border"
        style={{ background: "rgba(22,27,34,0.8)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <p className="text-[11px] font-semibold mb-3" style={{ color: "#c9d1d9" }}>Recent Activity</p>
        <div className="space-y-2">
          {ACTIVITY.map((a, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {a.type === "purchase" ? (
                  <ShoppingBag size={10} className="text-violet-400" />
                ) : (
                  <UserPlus size={10} className="text-cyan-400" />
                )}
                <span className="text-[10px]" style={{ color: "#8b949e" }}>{a.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {a.amount && (
                  <span className="text-[10px] font-medium" style={{ color: "#3fb950" }}>{a.amount}</span>
                )}
                <span className="text-[9px]" style={{ color: "#3d444d" }}>{a.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature chips */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {["dashboard stats", "CSV export", "affiliate mgmt", "user search"].map((f) => (
          <span
            key={f}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full"
            style={{
              background: "rgba(255,166,87,0.1)",
              border: "1px solid rgba(255,166,87,0.2)",
              color: "#ffa657",
            }}
          >
            <CheckCircle2 size={9} />
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}
