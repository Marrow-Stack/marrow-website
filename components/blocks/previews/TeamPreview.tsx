"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Crown, Shield, Eye, UserMinus, Mail, CheckCircle2, X, Plus } from "lucide-react";

const MEMBERS = [
  { name: "Sarah Chen",    email: "sarah@co.io",     role: "owner",  avatar: "SC" },
  { name: "James Park",    email: "james@dev.io",    role: "admin",  avatar: "JP" },
  { name: "Maria Lopez",   email: "maria@saas.io",   role: "member", avatar: "ML" },
  { name: "Alex Thompson", email: "alex@startup.io", role: "viewer", avatar: "AT" },
];

const ROLE_ICONS = {
  owner:  { icon: Crown,  color: "#f778ba", bg: "rgba(247,120,186,0.12)" },
  admin:  { icon: Shield, color: "#ffa657", bg: "rgba(255,166,87,0.12)" },
  member: { icon: Users,  color: "#79c0ff", bg: "rgba(121,192,255,0.12)" },
  viewer: { icon: Eye,    color: "#6e7681", bg: "rgba(110,118,129,0.12)" },
};

const PENDING_INVITES = [
  { email: "dev@new.io", role: "member" },
  { email: "cto@corp.io", role: "admin" },
];

export function TeamPreview() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  return (
    <div className="p-4 space-y-3 min-h-[460px] relative">
      {/* Header */}
      <div
        className="rounded-xl p-4 border flex items-center justify-between"
        style={{ background: "rgba(22,27,34,0.8)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "#c9d1d9" }}>Acme Corp Workspace</h3>
          <p className="text-[10px] mt-0.5" style={{ color: "#6e7681" }}>Pro plan · 4 members</p>
        </div>
        <motion.button
          onClick={() => setInviteOpen(true)}
          whileTap={{ y: 3 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium"
          style={{
            background: "rgba(103,232,249,0.1)",
            border: "1px solid rgba(103,232,249,0.2)",
            color: "#67e8f9",
          }}
        >
          <Plus size={11} />
          Invite
        </motion.button>
      </div>

      {/* Members list */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: "rgba(22,27,34,0.8)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="px-4 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-[11px] font-medium" style={{ color: "#c9d1d9" }}>Members</p>
        </div>
        {MEMBERS.map((m, i) => {
          const roleInfo = ROLE_ICONS[m.role as keyof typeof ROLE_ICONS];
          const RoleIcon = roleInfo.icon;
          return (
            <div
              key={m.email}
              className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
              style={{
                borderBottom: i < MEMBERS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: "rgba(255,255,255,0.08)", color: "#c9d1d9" }}
                >
                  {m.avatar}
                </div>
                <div>
                  <p className="text-[11px] font-medium" style={{ color: "#c9d1d9" }}>{m.name}</p>
                  <p className="text-[9px]" style={{ color: "#6e7681" }}>{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-full font-medium capitalize"
                  style={{
                    background: roleInfo.bg,
                    color: roleInfo.color,
                  }}
                >
                  <RoleIcon size={9} />
                  {m.role}
                </span>
                {m.role !== "owner" && (
                  <button className="p-1 rounded hover:bg-white/5 transition-colors" style={{ color: "#6e7681" }}>
                    <UserMinus size={11} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending invites */}
      <div
        className="rounded-xl border p-3 space-y-2"
        style={{ background: "rgba(22,27,34,0.8)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <p className="text-[11px] font-medium" style={{ color: "#c9d1d9" }}>Pending Invites</p>
        {PENDING_INVITES.map((inv) => (
          <div key={inv.email} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail size={11} style={{ color: "#6e7681" }} />
              <span className="text-[10px]" style={{ color: "#8b949e" }}>{inv.email}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full capitalize"
                style={{ background: "rgba(255,255,255,0.06)", color: "#6e7681" }}>
                {inv.role}
              </span>
            </div>
            <button className="text-[10px] transition-colors" style={{ color: "#6e7681" }}>
              <X size={11} />
            </button>
          </div>
        ))}
      </div>

      {/* Invite modal */}
      <AnimatePresence>
        {inviteOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className="absolute inset-4 rounded-2xl border p-5 z-10 flex flex-col gap-3"
            style={{
              background: "rgba(13,17,23,0.98)",
              borderColor: "rgba(103,232,249,0.2)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 0 30px rgba(103,232,249,0.1)",
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: "#c9d1d9" }}>Invite Member</p>
              <button onClick={() => setInviteOpen(false)} style={{ color: "#6e7681" }}>
                <X size={14} />
              </button>
            </div>
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full rounded-lg px-3 py-2 text-xs outline-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#c9d1d9",
              }}
            />
            <motion.button
              onClick={() => setInviteOpen(false)}
              whileTap={{ y: 3 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="w-full py-2 rounded-lg text-xs font-semibold"
              style={{ background: "linear-gradient(135deg, #0e7490, #06b6d4)", color: "#fff" }}
            >
              Send Invite
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature chips */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {["role hierarchy", "token invites", "permission guards", "db-agnostic"].map((f) => (
          <span
            key={f}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full"
            style={{
              background: "rgba(103,232,249,0.1)",
              border: "1px solid rgba(103,232,249,0.2)",
              color: "#67e8f9",
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
