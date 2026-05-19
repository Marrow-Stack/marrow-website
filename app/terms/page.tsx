import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { RefractiveDock } from "@/components/navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service — MarrowStack",
  description: "Terms governing the purchase and use of MarrowStack blocks.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen font-display">
      <RefractiveDock />
      <main className="container mx-auto max-w-2xl px-4 pt-36 pb-24">
        <div className="mb-10">
          <Link
            href="/"
            className="text-xs transition-opacity hover:opacity-70 mb-8 inline-block"
            style={{ color: "hsl(var(--metal-shine))" }}
          >
            ← MarrowStack
          </Link>
          <h1 className="text-3xl font-black text-reveal-light mb-3">Terms of Service</h1>
          <p className="text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
            Last updated: May 2025
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          <Section title="What you receive">
            <p>On purchase, you receive GitHub repository access to the specific block(s) you bought. A block is a TypeScript source file (or small directory) that you copy into your own project. You own the copy in your project; the source repository remains MarrowStack's.</p>
          </Section>

          <Section title="License">
            <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Web2 blocks (Auth, Admin, Team Workspace):</strong> You receive a perpetual, single-developer, unlimited-project commercial license. You may use the block in any number of your own projects. You may not resell, sublicense, or distribute the source to other developers — each developer who reads the source needs their own license.</p>
            <p className="mt-3"><strong style={{ color: "hsl(var(--metal-foreground))" }}>Solana blocks (SIWS, Payments):</strong> MIT licensed. You may use, modify, and redistribute freely, including in commercial projects, subject to the MIT license terms in the file header.</p>
          </Section>

          <Section title="Refunds">
            <p>If a block does not function in your stated environment (Next.js 14 or 15, App Router, Supabase) and we cannot resolve it within 5 business days, we will issue a full refund. Refunds are not available for "changed mind" after delivery — the source code is delivered on purchase. Contact <code className="font-mono text-[11px]">support@marrowstack.dev</code> before purchasing if you have compatibility questions.</p>
          </Section>

          <Section title="Updates">
            <p>Purchases include access to all future updates to the purchased block(s). Updates appear in the GitHub repository. There is no automatic update mechanism; you adopt updates when you choose to pull and apply them.</p>
          </Section>

          <Section title="Payments">
            <p>Fiat payments are processed by Dodo Payments, who acts as Merchant of Record and handles tax/VAT obligations. Solana payments settle directly to a specified Solana wallet. All prices are in USD.</p>
          </Section>

          <Section title="Prohibited use">
            <p>You may not use MarrowStack blocks to build a product that directly competes with MarrowStack (a block marketplace or library reseller). All other commercial uses are permitted.</p>
          </Section>

          <Section title="Warranties and liability">
            <p>Blocks are provided "as is." MarrowStack makes no warranty that they are free from bugs or suitable for any particular purpose. Your maximum remedy for any claim is a refund of the purchase price.</p>
          </Section>

          <Section title="Contact">
            <p>Legal questions: <code className="font-mono text-[11px]">legal@marrowstack.dev</code></p>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-bold mb-3" style={{ color: "hsl(var(--metal-foreground))" }}>{title}</h2>
      {children}
    </div>
  );
}
