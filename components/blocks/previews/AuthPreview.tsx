"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, Globe, Lock, Mail, Eye, EyeOff, CheckCircle2, Shield } from "lucide-react";

export function AuthPreview() {
  const [showPass, setShowPass] = useState(false);
  const [tab, setTab] = useState<"signin" | "register">("signin");

  return (
    <div className="flex items-center justify-center min-h-[460px] p-6">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div
          className="rounded-2xl border p-6 space-y-5"
          style={{
            background: "rgba(22,27,34,0.8)",
            borderColor: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="mx-auto w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3 border border-white/10">
              <Shield size={18} className="text-violet-400" />
            </div>
            <p className="text-white font-semibold text-sm">MarrowStack Auth</p>
            <p className="text-[#6e7681] text-xs">Secure, production-ready authentication</p>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-lg p-0.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {(["signin", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all"
                style={{
                  background: tab === t ? "rgba(255,255,255,0.1)" : "transparent",
                  color: tab === t ? "#c9d1d9" : "#6e7681",
                }}
              >
                {t === "signin" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* OAuth buttons */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: GitBranch, label: "GitHub" },
              { icon: Globe, label: "Google" },
            ].map(({ icon: Icon, label }) => (
              <motion.button
                key={label}
                whileTap={{ y: 3 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#c9d1d9",
                }}
              >
                <Icon size={13} />
                {label}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <span className="text-[10px]" style={{ color: "#6e7681" }}>or continue with email</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* Email field */}
          <div className="space-y-3">
            {tab === "register" && (
              <div className="relative">
                <input
                  readOnly
                  value="Jane Doe"
                  placeholder="Full name"
                  className="w-full rounded-lg px-3 py-2.5 text-xs outline-none pl-9"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#c9d1d9",
                  }}
                />
                <Mail size={13} className="absolute left-3 top-3" style={{ color: "#6e7681" }} />
              </div>
            )}

            <div className="relative">
              <input
                readOnly
                value="jane@example.com"
                placeholder="Email address"
                className="w-full rounded-lg px-3 py-2.5 text-xs outline-none pl-9"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(139,68,255,0.4)",
                  color: "#c9d1d9",
                  boxShadow: "0 0 0 2px rgba(139,68,255,0.12)",
                }}
              />
              <Mail size={13} className="absolute left-3 top-3 text-violet-400" />
            </div>

            <div className="relative">
              <input
                readOnly
                type={showPass ? "text" : "password"}
                value="SecurePass123"
                placeholder="Password"
                className="w-full rounded-lg px-3 py-2.5 text-xs outline-none pl-9 pr-9"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#c9d1d9",
                }}
              />
              <Lock size={13} className="absolute left-3 top-3" style={{ color: "#6e7681" }} />
              <button
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3"
                style={{ color: "#6e7681" }}
              >
                {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          {/* CTA */}
          <motion.button
            whileTap={{ y: 3 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="w-full py-2.5 rounded-lg text-xs font-semibold"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              color: "#fff",
              boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
            }}
          >
            {tab === "signin" ? "Sign In" : "Create Account"}
          </motion.button>

          {tab === "signin" && (
            <p className="text-center text-[10px]" style={{ color: "#6e7681" }}>
              <span className="cursor-pointer hover:text-violet-400 transition-colors">Forgot password?</span>
            </p>
          )}
        </div>

        {/* Feature chips */}
        <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
          {["bcrypt", "lockout protection", "JWT sessions", "email verify"].map((f) => (
            <span
              key={f}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full"
              style={{
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.2)",
                color: "#a78bfa",
              }}
            >
              <CheckCircle2 size={9} />
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
