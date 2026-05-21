"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  code:      string;
  language?: string;
  filename?: string;
}

export function CodeBlock({ code, language = "typescript", filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-xl overflow-hidden border text-[12.5px] font-mono leading-6"
      style={{ background: "#0d1117", borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ background: "#161b22", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <span style={{ color: "#6e7681" }}>{filename ?? language}</span>
        <motion.button
          onClick={handleCopy}
          whileTap={{ y: 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px]"
          style={{
            background: copied ? "rgba(35,134,54,0.15)" : "rgba(255,255,255,0.06)",
            border:     "1px solid",
            borderColor: copied ? "rgba(63,185,80,0.3)" : "rgba(255,255,255,0.1)",
            color:      copied ? "#3fb950" : "#8b949e",
          }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied" : "Copy"}
        </motion.button>
      </div>
      <pre className="p-4 overflow-x-auto" style={{ color: "#c9d1d9" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code
      className="px-1.5 py-0.5 rounded text-[12px] font-mono bg-black/[0.06] dark:bg-white/[0.06] border border-black/[0.1] dark:border-white/[0.08]"
      style={{ color: "hsl(var(--metal-foreground))" }}
    >
      {children}
    </code>
  );
}

interface EnvTableProps {
  rows: Array<{ name: string; required: boolean; default?: string; desc: string }>;
}

export function EnvTable({ rows }: EnvTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "hsl(var(--metal-border))" }}>
      <table className="w-full text-[12px]">
        <thead>
          <tr style={{ background: "var(--metal-gradient)", borderBottom: "1px solid hsl(var(--metal-border))" }}>
            {["Variable", "Required", "Default", "Purpose"].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-2.5 font-semibold text-[11px] uppercase tracking-wider"
                style={{ color: "hsl(var(--metal-shine))" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.name}
              className={i % 2 !== 0 ? "bg-black/[0.03] dark:bg-white/[0.03]" : ""}
              style={{
                borderBottom: i < rows.length - 1 ? "1px solid hsl(var(--metal-border))" : "none",
              }}
            >
              <td className="px-4 py-2.5 font-mono" style={{ color: "hsl(var(--metal-foreground))" }}>{row.name}</td>
              <td className="px-4 py-2.5">
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{
                    background: row.required ? "rgba(248,81,73,0.12)" : "rgba(255,255,255,0.06)",
                    color:      row.required ? "#f85149" : "#6e7681",
                  }}
                >
                  {row.required ? "yes" : "no"}
                </span>
              </td>
              <td className="px-4 py-2.5 font-mono" style={{ color: "#6e7681" }}>{row.default ?? "—"}</td>
              <td className="px-4 py-2.5" style={{ color: "hsl(var(--accent-mineral))" }}>{row.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
