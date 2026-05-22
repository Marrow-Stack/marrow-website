"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Mail } from "lucide-react";
import { motion } from "framer-motion";
import type { BlockEntry } from "@/lib/blocks/registry";
import { CATEGORY_LABELS } from "@/lib/blocks/registry";
import { RefractiveDock } from "@/components/navbar";
import { Footer } from "@/components/Footer";
import { TactileButton } from "@/components/marrow/TactileButton";

const SOLANA_AUTH_BULLETS = [
  "Server-side Ed25519 signature verification with constant-time comparison.",
  "Nonce single-use enforced at the database layer (unique constraint), not application logic.",
  "Replay rejection with 409, domain mismatch with 403, clock-skew window of 5 minutes.",
  "Bidirectional account linking (wallet↔email) with one-wallet-one-account conflict handling.",
  "RBAC roles carried in the JWT session — same session shape as the Auth block.",
  "Works with Phantom, Solflare, and any injected Solana provider via SIWS spec.",
];

const SOLANA_PAYMENTS_BULLETS = [
  "USDC SPL token transfers on Solana mainnet-beta with reference-key indexing.",
  "Finalization check via confirmed commitment level — not optimistic.",
  "Idempotent verification: same reference key is never accepted twice.",
  "Server-side RPC calls only — no wallet secrets exposed to the client.",
  "Webhook-style finalization hook for order fulfillment after on-chain confirmation.",
  "Compatible with any injected wallet (Phantom, Backpack, Solflare) on the checkout page.",
];

const RELATED: Record<string, string[]> = {
  "solana-auth": ["auth", "ratelimit", "errors"],
  "solana-payments": ["billing", "payments", "errors"],
};

function TeaserSignupForm({ slug }: { slug: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/teaser-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), slug }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm"
        style={{ color: "hsl(160 60% 45%)" }}
      >
        <Check size={14} />
        You&apos;re on the list. We&apos;ll email you when this launches.
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-center">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-1 ring-[hsl(var(--metal-shine))]"
        style={{
          background: "var(--metal-gradient)",
          borderColor: "hsl(var(--metal-border))",
          color: "hsl(var(--metal-foreground))",
        }}
      />
      <TactileButton
        type="submit"
        variant="primary"
        size="md"
        loading={status === "submitting"}
      >
        <Mail size={14} />
        Notify me
      </TactileButton>
      {status === "error" && (
        <span className="text-xs text-red-500">Something went wrong. Try again.</span>
      )}
    </form>
  );
}

export function BlockTeaserPage({ block }: { block: BlockEntry }) {
  const bullets =
    block.slug === "solana-auth" ? SOLANA_AUTH_BULLETS : SOLANA_PAYMENTS_BULLETS;
  const relatedSlugs = RELATED[block.slug] ?? [];

  return (
    <div className="min-h-screen font-display">
      <RefractiveDock />

      <main className="container mx-auto max-w-3xl px-4 pt-36 pb-24">
        <Link
          href="/blocks"
          className="inline-flex items-center gap-1.5 text-xs mb-10 hover:opacity-70 transition-opacity"
          style={{ color: "hsl(var(--metal-shine))" }}
        >
          <ArrowLeft size={12} />
          All blocks
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border"
              style={{ borderColor: "hsl(var(--metal-border))", color: "hsl(var(--metal-shine))" }}
            >
              {CATEGORY_LABELS[block.category]}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border"
              style={{ borderColor: "hsl(263 70% 58% / 0.4)", color: "hsl(263 70% 58%)" }}
            >
              Coming soon · Open source on launch
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-reveal-light mb-2 leading-tight">
            {block.name}
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
            {block.teaserNote}
          </p>
        </div>

        {/* What this will include */}
        <div
          className="rounded-2xl border p-6 mb-8"
          style={{
            background: "var(--metal-gradient)",
            borderColor: "hsl(var(--metal-border))",
          }}
        >
          <p
            className="text-xs font-bold uppercase tracking-widest mb-5"
            style={{ color: "hsl(var(--metal-shine))" }}
          >
            What this will include
          </p>
          <ul className="space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: "hsl(263 70% 58%)" }}
                />
                <span className="text-[13px] leading-relaxed" style={{ color: "hsl(var(--metal-foreground))" }}>
                  {b}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Email signup */}
        <div
          className="rounded-2xl border p-6 mb-10"
          style={{
            background: "var(--metal-gradient)",
            borderColor: "hsl(var(--metal-border))",
          }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: "hsl(var(--metal-foreground))" }}>
            Notify me when this ships
          </p>
          <p className="text-xs mb-4" style={{ color: "hsl(var(--accent-mineral))" }}>
            We&apos;ll send one email when the block goes live. No spam.
          </p>
          <TeaserSignupForm slug={block.slug} />
        </div>

        {/* Related real blocks */}
        {relatedSlugs.length > 0 && (
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: "hsl(var(--metal-shine))" }}
            >
              While you wait — blocks that exist today
            </p>
            <div className="flex flex-wrap gap-2">
              {relatedSlugs.map((s) => (
                <Link
                  key={s}
                  href={`/blocks/${s}`}
                  className="px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:opacity-80"
                  style={{
                    background: "var(--metal-gradient)",
                    borderColor: "hsl(var(--metal-border))",
                    color: "hsl(var(--metal-foreground))",
                  }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)} block →
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
