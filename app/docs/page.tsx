import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { BLOCKS } from "@/lib/blocks/registry";

export const metadata: Metadata = {
  title: "Docs — MarrowStack",
  description: "Technical documentation for MarrowStack blocks: getting started, auth, admin, team workspace, Solana auth (SIWS), and Solana USDC payments.",
};

const GUIDES = [
  {
    href:  "/docs/after-you-buy",
    label: "Getting Access",
    desc:  "Sign in, copy any block for free, and integrate it into your Next.js app in minutes.",
  },
  {
    href:  "/docs/getting-started",
    label: "Getting Started",
    desc:  "Prerequisites, env setup, Supabase wiring, and running a block in an existing Next.js app.",
  },
  {
    href:  "/docs/security",
    label: "Security Model",
    desc:  "What the blocks guarantee, what is the developer's responsibility, and the verify-before-deliver rule.",
  },
  {
    href:  "/docs/faq",
    label: "FAQ",
    desc:  "Licensing, Solana cluster questions, and ORM compatibility.",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  auth:          "Auth & Users",
  monetization:  "Monetization",
  communication: "Communication",
  content:       "Content",
  utility:       "Utility",
  ui:            "UI",
  solana:        "Solana",
};

const CATEGORY_ORDER = ["auth", "monetization", "communication", "content", "utility", "ui", "solana"];

function docHref(block: { slug: string }): string {
  return `/docs/blocks/${block.slug}`;
}

export default function DocsOverviewPage() {
  const availableBlocks = BLOCKS.filter((b) => b.status === "available");

  const byCategory = CATEGORY_ORDER.map((cat) => ({
    cat,
    label: CATEGORY_LABELS[cat],
    blocks: availableBlocks.filter((b) => b.category === cat),
  })).filter((g) => g.blocks.length > 0);

  return (
    <div className="space-y-10">
      {/* Intro */}
      <div>
        <h1 className="text-3xl font-black text-reveal-light mb-3">MarrowStack Documentation</h1>
        <p className="text-base leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          MarrowStack is a free, open-source library of production-ready TypeScript server actions for Next.js.
          Each block is a single file (or small directory) that you copy into your project, run a SQL migration,
          set env vars, and wire up. No custom framework, no SDK lock-in. Sign in to copy any block instantly.
        </p>
      </div>

      {/* How it works */}
      <div>
        <h2 className="text-lg font-bold mb-2" style={{ color: "hsl(var(--metal-foreground))" }}>
          How it works
        </h2>
        <ol className="list-decimal list-inside space-y-1.5 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <li>Sign in at marrowstack.dev (GitHub OAuth or Solana wallet).</li>
          <li>Browse the block library and open any block.</li>
          <li>Click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong> — all blocks are free.</li>
          <li>Paste the file(s) into your Next.js project.</li>
          <li>Run the included SQL migration in your Supabase project.</li>
          <li>Set the env vars, mount the API routes, and you&apos;re live.</li>
        </ol>
      </div>

      {/* Guides */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: "hsl(var(--metal-foreground))" }}>
          Guides
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GUIDES.map((s) => (
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

      {/* Block docs by category */}
      <div className="space-y-8">
        <h2 className="text-lg font-bold" style={{ color: "hsl(var(--metal-foreground))" }}>
          Integration guides
        </h2>

        {byCategory.map(({ cat, label, blocks }) => (
          <div key={cat}>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "hsl(var(--accent-mineral))" }}
            >
              {label}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {blocks.map((block) => (
                <Link key={block.slug} href={docHref(block)}>
                  <div
                    className="group p-4 rounded-xl border transition-all hover:shadow-sm"
                    style={{
                      background: "var(--metal-gradient)",
                      borderColor: "hsl(var(--metal-border))",
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p
                        className="text-sm font-semibold group-hover:opacity-80 transition-opacity"
                        style={{ color: "hsl(var(--metal-foreground))" }}
                      >
                        {block.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-medium capitalize"
                          style={{
                            color:
                              block.difficulty === "starter"      ? "hsl(var(--status-success))"
                            : block.difficulty === "intermediate" ? "hsl(var(--status-warning))"
                            : "hsl(var(--status-error))",
                          }}
                        >
                          {block.difficulty}
                        </span>
                        <ArrowRight
                          size={13}
                          className="transition-transform group-hover:translate-x-0.5"
                          style={{ color: "hsl(var(--metal-shine))" }}
                        />
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "hsl(var(--accent-mineral))" }}>
                      {block.description}
                    </p>
                    <p className="text-[10px] mt-2" style={{ color: "hsl(var(--metal-shine))" }}>
                      ~{block.estimatedSetupMinutes} min setup
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
