import React from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Getting Access — MarrowStack Docs",
  description: "Sign in and copy any MarrowStack block for free. All blocks are MIT licensed — no purchase required.",
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

export default function GettingAccessPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Getting started
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Getting Access</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          All MarrowStack blocks are free and MIT licensed. Sign in once, then copy any block directly
          from the browser. No payment, no waitlist.
        </p>
      </div>

      <Section title="1. Sign in">
        <p>
          You need a MarrowStack account to copy blocks. Two sign-in methods are supported,
          both resolve to the same account:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>
            <strong style={{ color: "hsl(var(--metal-foreground))" }}>GitHub OAuth</strong> —
            recommended. One click, no extra setup.
          </li>
          <li>
            <strong style={{ color: "hsl(var(--metal-foreground))" }}>Sign-In-With-Solana</strong> —
            signs a message with your Phantom, Solflare, or Backpack wallet.
          </li>
        </ul>
        <p>
          <Link href="/auth/signin" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>
            Sign in →
          </Link>
        </p>
      </Section>

      <Section title="2. Copy a block">
        <p>
          On any block&apos;s detail page, click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          All file contents are copied to your clipboard as a single payload — paste them into your project.
          You can also copy individual files using the per-file copy button in the viewer.
        </p>
        <p>
          <Link href="/blocks" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>
            Browse blocks →
          </Link>
        </p>
      </Section>

      <Section title="3. Integrate">
        <p>
          Each block ships as a single TypeScript file (or small set of files). The integration
          pattern is the same for all blocks:
        </p>
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Paste the block file(s) into your existing Next.js app.</li>
          <li>Run the SQL migration (embedded at the top of each block) in your Supabase SQL Editor.</li>
          <li>Install the block&apos;s peer dependencies (<code className="font-mono text-[11px] bg-black/[0.06] dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-black/[0.1] dark:border-white/[0.08]" style={{ color: "hsl(var(--metal-foreground))" }}>npm install</code> line is in each guide).</li>
          <li>Set the required environment variables (full table in each guide).</li>
          <li>Mount the API routes or server actions per the guide&apos;s &quot;Wire it in&quot; section.</li>
          <li>Run the verification check in the guide to confirm the block is working.</li>
        </ol>
      </Section>

      <Section title="4. Get help">
        <p>
          If something is not working, check the &quot;Failure modes &amp; fixes&quot; section in
          the block&apos;s integration guide — it covers the most common errors by exact cause and
          fix. For anything else, open an issue on GitHub or reach out via email.
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
