import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — MarrowStack Docs",
  description: "Licensing, Solana cluster questions, and ORM compatibility for MarrowStack blocks.",
};

export default function FaqDocsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-reveal-light mb-3">FAQ</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Common questions about licensing, Solana specifics, and compatibility.
        </p>
      </div>

      <Section title="Licensing">
        <FaqItem q="Are all blocks really free?">
          Yes. Every block on MarrowStack is free and MIT licensed. Sign in with GitHub OAuth or a Solana
          wallet and copy any block directly from the browser. No payment, no waitlist.
        </FaqItem>
        <FaqItem q="Can I use a block in commercial projects?">
          Yes. The MIT license lets you use, modify, and distribute the code in any project — personal or
          commercial — without restriction. Attribution is not required.
        </FaqItem>
        <FaqItem q="Do I get updates?">
          Yes. Blocks are updated in their public GitHub repositories. Pull the latest version of any block
          and copy the changed file into your project. There is no auto-update mechanism — you control when
          you adopt changes.
        </FaqItem>
      </Section>

      <Section title="Access">
        <FaqItem q="How do I get a block?">
          Sign in at marrowstack.dev (GitHub OAuth or Solana wallet), open any block, and click
          <strong> Copy all files</strong>. All file contents are copied to your clipboard. Paste them
          into your project. No cloning required.
        </FaqItem>
        <FaqItem q="Is there a CLI or code generator?">
          No. MarrowStack blocks are plain TypeScript files. Copy the file, run the SQL migration, set env vars.
          No generator, no scaffold tool, no dependency on a MarrowStack package at runtime.
        </FaqItem>
        <FaqItem q="Why do I need to sign in just to copy?">
          Sign-in prevents anonymous abuse of the copy API and lets us track which blocks are most useful.
          Both GitHub OAuth and Solana wallet sign-in take under 30 seconds.
        </FaqItem>
      </Section>

      <Section title="Solana-specific">
        <FaqItem q="Do the Solana blocks work on mainnet?">
          Yes — set <code className="font-mono text-[11px]">NEXT_PUBLIC_SOLANA_CLUSTER=mainnet-beta</code> and
          <code className="font-mono text-[11px]"> SOLANA_RPC_URL</code> to a private RPC endpoint. The playground
          on this site is hardcoded to devnet and cannot be switched to mainnet.
        </FaqItem>
        <FaqItem q="Which wallets does Solana Auth support?">
          The <code className="font-mono text-[11px]">WalletProviders</code> component bundles adapters for Phantom,
          Solflare, and Backpack. For wallets that support the SIWS standard (<code className="font-mono text-[11px]">solanaSignIn</code>),
          the hook uses it. For wallets that don't, it falls back to <code className="font-mono text-[11px]">signMessage</code>.
        </FaqItem>
        <FaqItem q="Does Solana Payments support tokens other than USDC?">
          No. The block is hardcoded to USDC on the configured cluster. Supporting other SPL tokens would require
          modifying the <code className="font-mono text-[11px]">USDC_MINTS</code> constant and removing the
          <code className="font-mono text-[11px]"> USDC mint correct</code> verification check — we don't recommend this.
        </FaqItem>
        <FaqItem q="Does Solana Payments support recurring billing?">
          Solana has no native pull payments — no wallet gives a protocol the permission to debit it on a schedule.
          The subscription scaffold in the payments block tracks billing cycles and generates new payment requests.
          Users must approve each payment. There are no silent recurring debits.
        </FaqItem>
        <FaqItem q="Why do you recommend a private RPC?">
          Public Solana RPC endpoints (devnet and mainnet-beta) have rate limits measured in requests per second.
          The payment confirmation poller calls <code className="font-mono text-[11px]">findReference</code> every 3 seconds
          per active payment. Under even moderate load this will hit rate limits. Helius, QuickNode, and Alchemy all
          have free tiers that are sufficient for early-stage apps.
        </FaqItem>
      </Section>

      <Section title="Compatibility">
        <FaqItem q="Does it work with Next.js 15?">
          Yes. Blocks are tested against Next.js 14 and 15 with the App Router. The Pages Router is not supported.
        </FaqItem>
        <FaqItem q="Does it work with Prisma / Drizzle / Kysely?">
          The web2 blocks use Supabase's JavaScript client directly. The Team Workspace block has an ORM adapter
          pattern — see the Teamspace docs for how to swap the default implementation. The Auth and Admin blocks
          can be adapted similarly, but the migration path requires more manual work.
        </FaqItem>
        <FaqItem q="Does it work with other databases (PlanetScale, Neon, Railway Postgres)?">
          The SQL migrations use standard PostgreSQL and should run on any Postgres-compatible database. The
          Supabase client can be replaced with <code className="font-mono text-[11px]">pg</code> or any Postgres driver —
          the block's database adapter calls are isolated to a small set of query functions at the bottom of each file.
        </FaqItem>
        <FaqItem q="Does it work with Bun?">
          Yes. All blocks are tested with Bun 1.x as the runtime. <code className="font-mono text-[11px]">bun install</code> and
          <code className="font-mono text-[11px]"> bun dev</code> work without any additional configuration.
        </FaqItem>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold" style={{ color: "hsl(var(--metal-foreground))" }}>{title}</h2>
      {children}
    </div>
  );
}

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div
      className="p-4 rounded-xl border"
      style={{ background: "var(--metal-gradient)", borderColor: "hsl(var(--metal-border))" }}
    >
      <p className="text-sm font-semibold mb-2" style={{ color: "hsl(var(--metal-foreground))" }}>{q}</p>
      <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>{children}</p>
    </div>
  );
}
