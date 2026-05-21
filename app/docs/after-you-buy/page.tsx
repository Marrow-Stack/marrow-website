import React from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "After You Buy — MarrowStack Docs",
  description: "What happens after purchase: GitHub delivery, sign-in methods, integrating your block, and where to get help.",
}

const BLOCK_GUIDES = [
  { slug: "auth",            label: "Auth System" },
  { slug: "admin",           label: "Admin Dashboard" },
  { slug: "teamspace",       label: "Team Workspace" },
  { slug: "solana-auth",     label: "Solana Auth (SIWS)" },
  { slug: "solana-payments", label: "Solana Payments (USDC)" },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold" style={{ color: "hsl(var(--metal-foreground))" }}>
        {title}
      </h2>
      <div className="text-sm leading-relaxed space-y-2" style={{ color: "hsl(var(--accent-mineral))" }}>
        {children}
      </div>
    </section>
  )
}

export default function AfterYouBuyPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Getting started
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">After You Buy</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          This page explains the universal post-purchase flow for every MarrowStack block:
          authenticate → pay → receive GitHub access → integrate. Each block also has its own
          detailed integration guide linked at the bottom of this page.
        </p>
      </div>

      <Section title="1. Authenticate">
        <p>
          You need a MarrowStack account before purchasing. Two sign-in methods are supported,
          both resolve to the same account:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>
            <strong style={{ color: "hsl(var(--metal-foreground))" }}>GitHub OAuth</strong> —
            recommended. Your GitHub username is known immediately; delivery is automatic after
            payment.
          </li>
          <li>
            <strong style={{ color: "hsl(var(--metal-foreground))" }}>Sign-In-With-Solana</strong> —
            signs a message with your Phantom, Solflare, or Backpack wallet. After payment, you
            will be prompted to provide your GitHub username so we can deliver the code.
          </li>
        </ul>
        <p>
          If you signed in with a wallet and later link a GitHub account (or vice versa), both
          identities resolve to the same account and delivery target.
        </p>
        <p>
          <Link href="/auth/signin" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>
            Sign in →
          </Link>
        </p>
      </Section>

      <Section title="2. Pay">
        <p>
          On each block&apos;s detail page, click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Purchase Block</strong>.
          You are taken to a checkout page with two payment rails:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>
            <strong style={{ color: "hsl(var(--metal-foreground))" }}>Card / Bank transfer via Dodo Payments</strong> —
            Dodo is the merchant of record; they handle tax and VAT globally.
            You are redirected to Dodo&apos;s hosted checkout page. On completion,
            a webhook confirms payment server-side and delivery is triggered automatically.
          </li>
          <li>
            <strong style={{ color: "hsl(var(--metal-foreground))" }}>Solana mainnet (SOL or USDC)</strong> —
            a live USD→SOL or USD→USDC quote is generated (locked for 90 seconds).
            Send the exact quoted amount to the treasury address shown.
            Paste your transaction signature and click &quot;Verify payment&quot;.
            The server verifies the on-chain transaction: correct recipient, correct amount
            (within ±1.5%), transaction finalized. Delivery is triggered after verification.
          </li>
        </ul>
        <p className="text-xs rounded-xl p-3" style={{ background: "hsl(var(--status-warning) / 0.10)", border: "1px solid hsl(var(--status-warning) / 0.20)", color: "hsl(var(--status-warning))" }}>
          Solana payments use <strong>mainnet-beta only</strong>. The playground previews on the block
          detail pages use devnet with simulated funds and are completely separate — they never
          touch the mainnet treasury.
        </p>
      </Section>

      <Section title="3. Receive your GitHub access">
        <p>
          After payment is confirmed server-side:
        </p>
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>
            GitHub sends a collaborator invitation to your GitHub account for{" "}
            <strong style={{ color: "hsl(var(--metal-foreground))" }}>Marrow-Stack/marrow-website-v1.2</strong>.
            Check your GitHub notifications or email inbox. Invitations expire after 7 days —
            use the dashboard to re-send if needed.
          </li>
          <li>Accept the invitation. You now have read access to the repository.</li>
          <li>
            Clone it:{" "}
            <code className="font-mono text-[11px] bg-black/[0.06] dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-black/[0.1] dark:border-white/[0.08]" style={{ color: "hsl(var(--metal-foreground))" }}>
              git clone git@github.com:Marrow-Stack/marrow-website-v1.2.git
            </code>
          </li>
          <li>Find your block file in the <code className="font-mono text-[11px] bg-black/[0.06] dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-black/[0.1] dark:border-white/[0.08]" style={{ color: "hsl(var(--metal-foreground))" }}>lib/</code> folder and copy it into your own project.</li>
        </ol>
        <p>
          <strong style={{ color: "hsl(var(--metal-foreground))" }}>Wallet-only buyers:</strong> after
          payment, your dashboard will show a prompt: &quot;Where should we deliver your code?&quot;
          Enter your GitHub username (validated against the GitHub API). Delivery runs immediately
          after you save it.
        </p>
        <p>
          If delivery fails for any reason, your dashboard shows the error and a &quot;Re-deliver&quot;
          button. It is safe to click multiple times — delivery is idempotent.
        </p>
      </Section>

      <Section title="4. Integrate">
        <p>
          Each block ships as a single TypeScript file (or small set of files). The integration
          pattern is the same for all blocks:
        </p>
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Copy the block file(s) into your existing Next.js app.</li>
          <li>Run the SQL migration (embedded at the top of each block) in your Supabase SQL Editor.</li>
          <li>Install the block&apos;s peer dependencies (<code className="font-mono text-[11px] bg-black/[0.06] dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-black/[0.1] dark:border-white/[0.08]" style={{ color: "hsl(var(--metal-foreground))" }}>npm install</code> line is in each guide).</li>
          <li>Set the required environment variables (full table in each guide).</li>
          <li>Mount the API routes or server actions per the guide&apos;s &quot;Wire it in&quot; section.</li>
          <li>Run the verification check in the guide to confirm the block is working.</li>
        </ol>
      </Section>

      <Section title="5. Get help">
        <p>
          If something is not working, check the &quot;Failure modes &amp; fixes&quot; section in
          the block&apos;s integration guide — it covers the most common errors by exact cause and
          fix. For anything else, reply to your purchase confirmation email.
        </p>
      </Section>

      {/* Per-block guide links */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: "hsl(var(--metal-foreground))" }}>
          Integration guides
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BLOCK_GUIDES.map((g) => (
            <Link key={g.slug} href={`/docs/blocks/${g.slug}`}>
              <div
                className="group p-4 rounded-xl border transition-all hover:shadow-sm"
                style={{ background: "var(--metal-gradient)", borderColor: "hsl(var(--metal-border))" }}
              >
                <div className="flex items-center justify-between">
                  <p
                    className="text-sm font-semibold group-hover:opacity-80 transition-opacity"
                    style={{ color: "hsl(var(--metal-foreground))" }}
                  >
                    {g.label}
                  </p>
                  <ArrowRight size={13} style={{ color: "hsl(var(--metal-shine))" }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
