import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog — MarrowStack",
  description: "Release notes for MarrowStack blocks: new blocks, security patches, and API compatibility updates.",
};

const ENTRIES: ChangeEntry[] = [
  {
    version: "1.2.0",
    date: "2025-05-19",
    tag: "launch",
    items: [
      {
        type: "new",
        text: "Solana Auth (SIWS) block — Sign-In-With-Solana with Ed25519 server-side verification, single-use nonces, domain binding, and wallet↔email account linking. MIT licensed.",
      },
      {
        type: "new",
        text: "Solana Payments block — Reference-keyed USDC payments with 6-point on-chain verification, idempotency, subscription scaffold, and optional x402 pay-per-request middleware. MIT licensed.",
      },
      {
        type: "new",
        text: "Interactive playgrounds for all five blocks — step-through simulations of the auth and payment flows, running against Solana devnet.",
      },
      {
        type: "new",
        text: "Full documentation site — exhaustive per-block reference pages for all five blocks, a security model page, and an FAQ.",
      },
      {
        type: "improvement",
        text: "Block detail pages now show a three-tab playground (Preview, Code, Usage) with a syntax-highlighted code viewer.",
      },
      {
        type: "improvement",
        text: "All block files include MIT or commercial license headers, embedded SQL migrations, and @ts-nocheck to ensure clean TypeScript checking in the platform repo without requiring buyer-side dependencies.",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2025-03-01",
    tag: "update",
    items: [
      {
        type: "new",
        text: "Team Workspace block — role hierarchy (owner/admin/member/viewer), invite flows with token expiry, composable permission matrix, and ORM adapter pattern.",
      },
      {
        type: "improvement",
        text: "Admin block: added feature flag rollout percentages, audit log, and CSV export.",
      },
      {
        type: "fix",
        text: "Auth block: lockout IP detection now reads X-Forwarded-For correctly behind reverse proxies.",
      },
    ],
  },
  {
    version: "1.0.0",
    date: "2025-01-15",
    tag: "launch",
    items: [
      {
        type: "new",
        text: "Auth System block — email/password with bcrypt, GitHub and Google OAuth, email verification, brute-force lockout, and RBAC.",
      },
      {
        type: "new",
        text: "Admin Dashboard block — user management, revenue analytics, and feature flags.",
      },
      {
        type: "new",
        text: "Delivery via GitHub repository access — purchased blocks appear in a private repo within seconds of payment confirmation.",
      },
    ],
  },
];

type ChangeType = "new" | "improvement" | "fix" | "security";
type ChangeEntry = {
  version: string;
  date: string;
  tag: string;
  items: { type: ChangeType; text: string }[];
};

const TYPE_STYLES: Record<ChangeType, { label: string; bg: string; color: string }> = {
  new:         { label: "New",         bg: "rgba(35,134,54,0.12)",  color: "#3fb950" },
  improvement: { label: "Improved",    bg: "rgba(121,192,255,0.1)", color: "#79c0ff" },
  fix:         { label: "Fix",         bg: "rgba(255,166,87,0.1)",  color: "#ffa657" },
  security:    { label: "Security",    bg: "rgba(248,81,73,0.1)",   color: "#f85149" },
};

const TAG_STYLES: Record<string, { bg: string; color: string }> = {
  launch:  { bg: "rgba(35,134,54,0.12)",  color: "#3fb950" },
  update:  { bg: "rgba(121,192,255,0.1)", color: "#79c0ff" },
  patch:   { bg: "rgba(255,166,87,0.1)",  color: "#ffa657" },
};

export default function ChangelogPage() {
  return (
    <main className="min-h-screen pt-32 pb-24">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
            MarrowStack
          </p>
          <h1 className="text-3xl font-black text-reveal-light mb-3">Changelog</h1>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
            Release notes for all blocks. Security patches are released immediately; feature updates are batched.
          </p>
        </div>

        <div className="space-y-10">
          {ENTRIES.map((entry) => {
            const tagStyle = TAG_STYLES[entry.tag] ?? TAG_STYLES.update;
            return (
              <div key={entry.version} className="relative pl-6">
                <div
                  className="absolute left-0 top-2 w-2 h-2 rounded-full"
                  style={{ background: tagStyle.color }}
                />
                <div
                  className="absolute left-[7px] top-4 bottom-0 w-px"
                  style={{ background: "hsl(var(--metal-border))" }}
                />

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-lg font-bold" style={{ color: "hsl(var(--metal-foreground))" }}>
                    v{entry.version}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                    style={{ background: tagStyle.bg, color: tagStyle.color }}
                  >
                    {entry.tag}
                  </span>
                  <span className="text-xs" style={{ color: "hsl(var(--accent-mineral))" }}>
                    {entry.date}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {entry.items.map((item, i) => {
                    const s = TYPE_STYLES[item.type];
                    return (
                      <div key={i} className="flex gap-3 items-start text-sm">
                        <span
                          className="mt-0.5 shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={{ background: s.bg, color: s.color, minWidth: "60px", textAlign: "center" }}
                        >
                          {s.label}
                        </span>
                        <p style={{ color: "hsl(var(--accent-mineral))" }}>{item.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
