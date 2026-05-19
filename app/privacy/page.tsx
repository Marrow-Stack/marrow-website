import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { RefractiveDock } from "@/components/navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — MarrowStack",
  description: "How MarrowStack collects, uses, and protects your data.",
};

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-black text-reveal-light mb-3">Privacy Policy</h1>
          <p className="text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
            Last updated: May 2025
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          <Section title="What we collect">
            <p>When you purchase a block, we collect your email address and payment details (processed by Dodo Payments — we never see raw card numbers). If you sign in with GitHub, we receive your GitHub username and email. If you sign in with a Solana wallet, we receive your wallet public key (a public address, not a secret).</p>
            <p className="mt-3">We do not sell, rent, or share your personal data with third parties outside of what is necessary to fulfill your purchase (GitHub repository access delivery) and comply with law.</p>
          </Section>

          <Section title="How we use it">
            <ul className="list-disc list-inside space-y-1.5">
              <li>To deliver block repository access after a confirmed purchase.</li>
              <li>To send transactional emails (purchase confirmation, delivery notification).</li>
              <li>To authenticate you on return visits.</li>
              <li>To handle refund requests.</li>
            </ul>
          </Section>

          <Section title="Payments">
            <p>All payments are processed by Dodo Payments, who acts as the Merchant of Record. Your card details are never stored on MarrowStack servers. Dodo's privacy policy governs payment data handling.</p>
            <p className="mt-3">For Solana payments, we record your wallet public key and the on-chain transaction signature for reconciliation. No private key is ever requested or stored.</p>
          </Section>

          <Section title="Cookies and analytics">
            <p>We use no third-party analytics scripts or advertising trackers. We set session cookies required for authentication. No fingerprinting, no behavioral tracking.</p>
          </Section>

          <Section title="Data retention">
            <p>Order records are kept for 7 years for accounting purposes. Account data is deleted on request, subject to legal hold obligations. Contact <code className="font-mono text-[11px]">privacy@marrowstack.dev</code> to request deletion.</p>
          </Section>

          <Section title="Contact">
            <p>Questions about privacy: <code className="font-mono text-[11px]">privacy@marrowstack.dev</code></p>
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
