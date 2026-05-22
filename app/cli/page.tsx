"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Mail, Terminal } from "lucide-react";
import { RefractiveDock } from "@/components/navbar";
import { Footer } from "@/components/Footer";
import { TactileButton } from "@/components/marrow/TactileButton";

const CLI_PREVIEW = `$ npx marrowstack add auth

  MarrowStack CLI v0.1.0

  → Resolving ms-block-auth@main (commit a1b2c3d)…
  → Fetching 4 files…
  ✔ AuthPage.tsx         copied to src/components/auth/
  ✔ index.ts             copied to src/lib/auth/
  ✔ package.json         (dependencies noted below)
  ✔ Readme.md            copied to docs/blocks/

  Install dependencies:
    bun add next-auth @supabase/supabase-js bcryptjs zod

  Done. See docs/blocks/Readme.md for setup steps.
`;

function TeaserSignupForm() {
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
        body: JSON.stringify({ email: email.trim(), slug: "cli" }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: "hsl(160 60% 45%)" }}>
        <Check size={14} />
        You&apos;re on the list. We&apos;ll email you on launch day.
      </div>
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
      <TactileButton type="submit" variant="primary" size="md" loading={status === "submitting"}>
        <Mail size={14} />
        Notify me
      </TactileButton>
      {status === "error" && (
        <span className="text-xs" style={{ color: "hsl(var(--status-error))" }}>
          Something went wrong. Try again.
        </span>
      )}
    </form>
  );
}

export default function CLIPage() {
  const [previewCopied, setPreviewCopied] = useState(false);

  return (
    <div className="min-h-screen font-display">
      <RefractiveDock />

      <main className="container mx-auto max-w-3xl px-4 pt-36 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-2.5 mb-4">
              <Terminal size={18} style={{ color: "hsl(var(--metal-shine))" }} />
              <span
                className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border"
                style={{ borderColor: "hsl(263 70% 58% / 0.4)", color: "hsl(263 70% 58%)" }}
              >
                Coming next
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-reveal-light mb-3 leading-tight">
              MarrowStack CLI
            </h1>
            <p className="text-base leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
              Today, every block is one click on its page. Soon, every block will be one command:{" "}
              <code
                className="text-sm px-2 py-0.5 rounded-md font-mono"
                style={{ background: "hsl(var(--metal-border) / 0.5)", color: "hsl(var(--metal-foreground))" }}
              >
                npx marrowstack add &lt;block&gt;
              </code>
              . The CLI is in development. Sign up to be the first to install it.
            </p>
          </div>

          {/* Preview — labeled clearly as preview */}
          <div
            className="rounded-2xl border mb-2 overflow-hidden"
            style={{
              background: "hsl(220 20% 8%)",
              borderColor: "hsl(var(--metal-border))",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-2.5 border-b"
              style={{ borderColor: "hsl(var(--metal-border))", background: "hsl(220 20% 10%)" }}
            >
              <span className="text-xs font-mono" style={{ color: "hsl(var(--metal-shine))" }}>
                Terminal
              </span>
              <button
                className="text-[11px] px-2.5 py-1 rounded-md border transition-all"
                style={{
                  borderColor: "hsl(var(--metal-border))",
                  color: "hsl(var(--metal-shine))",
                }}
                onClick={() => {
                  navigator.clipboard?.writeText("npx marrowstack add auth").catch(() => {});
                  setPreviewCopied(true);
                  setTimeout(() => setPreviewCopied(false), 2000);
                }}
              >
                {previewCopied ? "Copied!" : "Copy command"}
              </button>
            </div>
            <pre
              className="p-5 text-[13px] font-mono leading-relaxed overflow-x-auto"
              style={{ color: "hsl(210 15% 75%)" }}
            >
              {CLI_PREVIEW}
            </pre>
          </div>
          <p className="text-[11px] mb-10 text-center italic" style={{ color: "hsl(var(--metal-shine))" }}>
            Preview — not yet shipped. The actual output will look like this.
          </p>

          {/* Signup */}
          <div
            className="rounded-2xl border p-6 mb-10"
            style={{
              background: "var(--metal-gradient)",
              borderColor: "hsl(var(--metal-border))",
            }}
          >
            <p className="text-sm font-semibold mb-1" style={{ color: "hsl(var(--metal-foreground))" }}>
              Notify me when the CLI ships
            </p>
            <p className="text-xs mb-4" style={{ color: "hsl(var(--accent-mineral))" }}>
              One email on launch day. No spam, no series.
            </p>
            <TeaserSignupForm />
          </div>

          {/* GitHub link */}
          <div className="text-center">
            <p className="text-sm mb-3" style={{ color: "hsl(var(--accent-mineral))" }}>
              Star the repo to get notified natively on GitHub:
            </p>
            <a
              href="https://github.com/Marrow-Stack/marrow-stack"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl border transition-all hover:opacity-80"
              style={{
                background: "var(--metal-gradient)",
                borderColor: "hsl(var(--metal-border))",
                color: "hsl(var(--metal-foreground))",
              }}
            >
              github.com/Marrow-Stack/marrow-stack →
            </a>
          </div>

          {/* Back to blocks */}
          <div className="mt-12 text-center">
            <Link
              href="/blocks"
              className="text-xs hover:opacity-70 transition-opacity"
              style={{ color: "hsl(var(--metal-shine))" }}
            >
              ← Browse all 17 blocks available today
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
