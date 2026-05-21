import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs — MarrowStack",
  description: "Technical documentation for MarrowStack blocks: post-purchase flow, auth, admin, team workspace, Solana auth (SIWS), and Solana USDC payments.",
};

const SECTIONS = [
  {
    href:  "/docs/after-you-buy",
    label: "After You Buy",
    desc:  "Universal post-purchase flow: auth, payment rails (Dodo + Solana), GitHub delivery, and how to get help.",
  },
  {
    href:  "/docs/getting-started",
    label: "Getting Started",
    desc:  "Prerequisites, env setup, Supabase wiring, and running a block in an existing Next.js app.",
  },
  {
    href:  "/docs/blocks/auth",
    label: "Auth System",
    desc:  "Email/password with bcrypt, GitHub/Google OAuth, email verification, lockout protection, and RBAC.",
  },
  {
    href:  "/docs/blocks/admin",
    label: "Admin Dashboard",
    desc:  "User management, revenue analytics, feature flags with rollout percentages, and CSV export.",
  },
  {
    href:  "/docs/blocks/teamspace",
    label: "Team Workspace",
    desc:  "Role hierarchy, invite flows, permission matrix, and ORM-agnostic adapter pattern.",
  },
  {
    href:  "/docs/blocks/solana-auth",
    label: "Solana Auth (SIWS)",
    desc:  "Sign-In-With-Solana: Ed25519 verification, single-use nonces, domain binding, and wallet↔account linking.",
  },
  {
    href:  "/docs/blocks/solana-payments",
    label: "Solana Payments (USDC)",
    desc:  "Reference-keyed USDC payments, 6-point on-chain verification, idempotency, and optional x402 middleware.",
  },
  {
    href:  "/docs/security",
    label: "Security Model",
    desc:  "What the blocks guarantee, what is the buyer's responsibility, and the verify-before-deliver rule.",
  },
  {
    href:  "/docs/faq",
    label: "FAQ",
    desc:  "Licensing, updates, refunds, Solana cluster questions, and ORM compatibility.",
  },
];

export default function DocsOverviewPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-reveal-light mb-3">MarrowStack Documentation</h1>
        <p className="text-base leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          MarrowStack sells production-ready TypeScript server actions for Next.js. Each block is a
          single file (or small directory) that you copy into your project, run a SQL migration, set
          env vars, and wire up. No custom framework, no SDK lock-in.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-2" style={{ color: "hsl(var(--metal-foreground))" }}>
          Web2 + Solana
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          The library covers the seam that no general-purpose boilerplate covers: production auth and
          admin for web2 apps, <em>and</em> the Solana-native primitives — SIWS sign-in and USDC payments —
          that Solana apps get subtly wrong. All blocks share the same delivery format, the same Supabase
          database adapter, and the same TypeScript strictness.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-2" style={{ color: "hsl(var(--metal-foreground))" }}>
          Delivery model
        </h2>
        <ol className="list-decimal list-inside space-y-1.5 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <li>Purchase a block at marrowstack.dev.</li>
          <li>You receive GitHub repository access within seconds.</li>
          <li>Clone the repo, copy the block file(s) into your project.</li>
          <li>Run the included SQL migration in your Supabase project.</li>
          <li>Set the env vars documented for the block.</li>
          <li>Mount the API routes and drop in the UI component (if applicable).</li>
        </ol>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: "hsl(var(--metal-foreground))" }}>
          Documentation sections
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href}>
              <div
                className="group p-4 rounded-xl border transition-all hover:shadow-sm"
                style={{
                  background: "var(--metal-gradient)",
                  borderColor: "hsl(var(--metal-border))",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold group-hover:opacity-80 transition-opacity"
                     style={{ color: "hsl(var(--metal-foreground))" }}>
                    {s.label}
                  </p>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5"
                    style={{ color: "hsl(var(--metal-shine))" }} />
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
                  {s.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
