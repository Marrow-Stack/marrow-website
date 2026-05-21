"use client";

import React from "react";
import { motion } from "framer-motion";

interface BlockPlaceholderProps {
  name: string;
  icon: React.ReactNode;
  lines: Array<{ label: string; value: string; color?: string }>;
}

export function BlockPlaceholder({ name, icon, lines }: BlockPlaceholderProps) {
  return (
    <div className="flex items-center justify-center min-h-[460px] p-6">
      <div className="w-full max-w-sm space-y-3">
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{ background: "rgba(22,27,34,0.8)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {icon}
            </div>
            <span className="text-sm font-semibold" style={{ color: "#c9d1d9" }}>{name}</span>
          </div>

          <div className="space-y-2.5">
            {lines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="flex items-center justify-between text-xs"
              >
                <span style={{ color: "#6e7681" }}>{line.label}</span>
                <span
                  className="px-2 py-0.5 rounded-md font-mono"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: line.color ?? "#c9d1d9",
                  }}
                >
                  {line.value}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-center text-[11px]" style={{ color: "#3d444d" }}>
          Interactive preview renders here
        </p>
      </div>
    </div>
  );
}
