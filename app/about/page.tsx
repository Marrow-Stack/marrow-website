import type { Metadata } from "next";
import Link from "next/link";
import { RefractiveDock } from "@/components/navbar";
import { Footer } from "@/components/Footer";
import { ExternalLink, GitBranch } from "lucide-react";

export const metadata: Metadata = {
  title: "About — MarrowStack",
  description:
    "MarrowStack is a library of production-ready TypeScript blocks for Next.js. Built and maintained by Samarth Shukla.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen font-display">
      <RefractiveDock />

      <main className="container mx-auto max-w-2xl px-4 pt-40 pb-24">
        <p
          className="text-xs font-bold uppercase tracking-[0.2em] mb-4"
          style={{ color: "hsl(var(--accent-mineral))" }}
        >
          About
        </p>
        <h1 className="text-4xl font-black text-reveal-light leading-tight mb-8">
          MarrowStack
        </h1>

        <div
          className="space-y-6 text-[15px] leading-relaxed"
          style={{ color: "hsl(var(--metal-foreground))" }}
        >
          <p>
            MarrowStack sells production-ready TypeScript blocks for Next.js.
            Each block is a self-contained, MIT-licensed module you drop into
            your codebase: server actions, database schema, API routes, and any
            wiring code — ready to run, not a scaffold to modify.
          </p>

          <p>
            The argument for à-la-carte: every monolith boilerplate ships with
            opinions you didn&apos;t ask for — a billing library you&apos;ll replace,
            a component system that fights your design, an ORM you didn&apos;t
            choose. Blocks let you take only what you need. The remaining surface
            area stays yours.
          </p>

          <p>
            The web2+Solana combination is intentional. Solana authentication
            (SIWS) and USDC payments solve real problems that no competitor&apos;s
            boilerplate covers. If you&apos;re building a consumer app with wallet
            sign-in or a commerce product accepting crypto, the plumbing exists
            here and is open-sourced under MIT.
          </p>

          <div
            className="rounded-xl border p-5 space-y-3"
            style={{
              borderColor: "hsl(var(--metal-border))",
              background: "var(--metal-gradient)",
            }}
          >
            <p className="text-sm font-bold" style={{ color: "hsl(var(--metal-foreground))" }}>
              What&apos;s shipped
            </p>
            <ul className="space-y-2 text-[13px]" style={{ color: "hsl(var(--accent-mineral))" }}>
              <li>
                <a
                  href="https://github.com/Marrow-Stack"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                >
                  <GitBranch size={12} />
                  Marrow-Stack GitHub org
                  <ExternalLink size={10} />
                </a>
                {" "}— block delivery repos
              </li>
              <li>Solana Auth (SIWS) — open-sourced MIT, Ed25519 + nonce + session</li>
              <li>Solana Payments (USDC) — open-sourced MIT, reference-keyed, on-chain verified</li>
              <li>19 production blocks across 6 categories, starting at $9</li>
            </ul>
          </div>

          <p>
            Built and maintained by Samarth Shukla. India-based, remote, indie.
            Questions and support go to{" "}
            <a
              href="mailto:samarth@marrowstack.dev"
              className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              samarth@marrowstack.dev
            </a>
            .
          </p>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/blocks"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all hover:opacity-80"
            style={{
              borderColor: "hsl(var(--metal-border))",
              color: "hsl(var(--metal-foreground))",
              background: "var(--metal-gradient)",
            }}
          >
            Browse all blocks
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ color: "hsl(var(--metal-shine))" }}
          >
            Documentation
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
