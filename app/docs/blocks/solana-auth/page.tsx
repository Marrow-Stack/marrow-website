import React from "react"
import type { Metadata } from "next"
import { CodeBlock, EnvTable, InlineCode } from "@/components/docs/CodeBlock"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Solana Auth (SIWS) — Integration Guide — MarrowStack",
  description: "Integration walkthrough for the MarrowStack Solana Auth block: Sign-In-With-Solana, Ed25519 verification, single-use nonces, domain binding, wallet↔account linking.",
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold" style={{ color: "hsl(var(--metal-foreground))" }}>{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
        {children}
      </div>
    </section>
  )
}

export default function SolanaAuthDocsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2 text-emerald-500">Solana</p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Solana Auth (SIWS)</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Sign-In-With-Solana for Next.js: server-side Ed25519 signature verification, single-use
          nonces, domain binding, RBAC, and wallet↔email account linking. Devnet playground available
          on the block detail page — this guide is for <strong style={{ color: "hsl(var(--metal-foreground))" }}>mainnet-beta production</strong> use.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">Read the Getting Access guide</Link> if you haven&apos;t yet.
        </p>
      </div>

      <Section title="1. Get the file">
        <p>
          Sign in at marrowstack.dev, open the{" "}
          <Link href="/blocks/solana-auth" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>Solana Auth block</Link>,
          and click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          Paste <InlineCode>lib/solana-auth.tsx</InlineCode> (~860 lines) into your project. Exports:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li><InlineCode>useSolanaAuth()</InlineCode> — React hook: connect → sign → verify in one call</li>
          <li><InlineCode>SignInWithSolanaButton</InlineCode> — drop-in component (Phantom, Solflare, Backpack)</li>
          <li>Two API route handlers: <InlineCode>solanaAuthNonceHandler</InlineCode> and <InlineCode>solanaAuthVerifyHandler</InlineCode></li>
          <li><InlineCode>WalletProviders</InlineCode> — wallet-adapter context wrapper</li>
          <li><InlineCode>buildSolanaCredentialsProvider()</InlineCode> — NextAuth Credentials stub</li>
          <li>SQL migration: <InlineCode>auth_nonces</InlineCode> and <InlineCode>wallets</InlineCode> tables</li>
        </ul>
        <p>
          The file contains <InlineCode>@ts-nocheck</InlineCode> at the top so it type-checks cleanly in
          this repo without Solana peer dependencies installed. Remove it in your own project after installing peers.
        </p>
        <div
          className="p-3 rounded-xl text-xs"
          style={{ background: "hsl(var(--status-warning) / 0.10)", border: "1px solid hsl(var(--status-warning) / 0.20)", color: "hsl(var(--status-warning))" }}
        >
          The playground on the block detail page uses <strong>devnet</strong> with simulated wallets.
          Your production integration targets <strong>mainnet-beta</strong>. Set <InlineCode>NEXT_PUBLIC_SOLANA_CLUSTER=mainnet-beta</InlineCode>{" "}
          and use a mainnet RPC endpoint. Never use a devnet wallet address for production sign-in.
        </div>
      </Section>

      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>Supabase project</li>
          <li>NextAuth already set up (the block adds a Credentials provider to your existing config)</li>
          <li>Users with Phantom, Solflare, or Backpack wallet browser extension installed (for the sign-in button)</li>
        </ul>
      </Section>

      <Section title="3. Install">
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>Clone the repo and copy <InlineCode>solana-auth.tsx</InlineCode> into your project at <InlineCode>lib/solana-auth.tsx</InlineCode>.</li>
          <li>Remove <InlineCode>@ts-nocheck</InlineCode> from line 1.</li>
          <li>Install peer dependencies:</li>
        </ol>
        <CodeBlock language="bash" code={`npm install @solana/web3.js bs58 tweetnacl
npm install @solana/wallet-adapter-base @solana/wallet-adapter-react \\
    @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets`} />
      </Section>

      <Section title="4. Environment">
        <EnvTable rows={[
          { name: "NEXT_PUBLIC_SUPABASE_URL",        required: true,  desc: "Your Supabase project URL" },
          { name: "SUPABASE_SERVICE_ROLE_KEY",       required: true,  desc: "Service role key — server-side only" },
          { name: "NEXT_PUBLIC_SOLANA_CLUSTER",      required: true,  default: "mainnet-beta", desc: "Must be mainnet-beta in production. devnet is for the playground only." },
          { name: "SOLANA_RPC_URL",                  required: false, desc: "Custom mainnet RPC endpoint. Falls back to the public endpoint (rate-limited)." },
          { name: "NEXT_PUBLIC_APP_URL",             required: true,  desc: "Your app's canonical URL, used for domain binding in the SIWS message." },
          { name: "NEXTAUTH_SECRET",                 required: true,  desc: "Required by NextAuth. Generate: openssl rand -base64 32" },
        ]} />
      </Section>

      <Section title="5. Database">
        <p>
          Run the <InlineCode>MIGRATION</InlineCode> constant from the top of <InlineCode>solana-auth.tsx</InlineCode> in Supabase SQL Editor.
        </p>
        <p>Creates two tables:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li><InlineCode>auth_nonces</InlineCode> — single-use SIWS challenges with wallet address, domain, TTL, and consumed_at</li>
          <li><InlineCode>wallets</InlineCode> — links wallet addresses to user accounts, with RLS</li>
        </ul>
        <p>RLS on both tables: service role has full access; anon is blocked.</p>
      </Section>

      <Section title="6. Wire it in">
        <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Step 1 — Mount WalletProviders in layout:</strong></p>
        <CodeBlock filename="app/layout.tsx" code={`import { WalletProviders } from '@/lib/solana-auth'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <WalletProviders cluster="mainnet-beta">
          {children}
        </WalletProviders>
      </body>
    </html>
  )
}`} />
        <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Step 2 — Mount the two API routes:</strong></p>
        <CodeBlock filename="app/api/solana-auth/nonce/route.ts" code={`import { solanaAuthNonceHandler } from '@/lib/solana-auth'
export const GET = solanaAuthNonceHandler`} />
        <CodeBlock filename="app/api/solana-auth/verify/route.ts" code={`import { solanaAuthVerifyHandler } from '@/lib/solana-auth'
export const POST = solanaAuthVerifyHandler`} />
        <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Step 3 — Add the Credentials provider to NextAuth:</strong></p>
        <CodeBlock filename="lib/auth.ts" code={`import { buildSolanaCredentialsProvider } from '@/lib/solana-auth'
import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'

export const authOptions = {
  providers: [
    GitHub({ ... }),
    buildSolanaCredentialsProvider(),   // add this
  ],
}`} />
        <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Step 4 — Drop the button into your sign-in page:</strong></p>
        <CodeBlock filename="app/auth/signin/page.tsx" code={`'use client'
import { SignInWithSolanaButton } from '@/lib/solana-auth'

export default function SignInPage() {
  return (
    <div>
      <SignInWithSolanaButton
        onSuccess={(session) => console.log('Signed in:', session)}
        onError={(err) => console.error(err)}
      />
    </div>
  )
}`} />
      </Section>

      <Section title="7. Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>
            Open your sign-in page. The <InlineCode>SignInWithSolanaButton</InlineCode> should render.
            Click it — your wallet extension should open.
          </li>
          <li>
            Approve the connection. The button should transition to &quot;Sign message&quot; state.
          </li>
          <li>
            Sign the message in your wallet. The button transitions to &quot;Verifying…&quot; and
            then to &quot;Signed in&quot;.
          </li>
          <li>
            Confirm a row in <InlineCode>auth_nonces</InlineCode> has <InlineCode>consumed_at</InlineCode> set (replay protection).
          </li>
          <li>
            Confirm a row in <InlineCode>wallets</InlineCode> links the wallet address to a user account.
          </li>
          <li>
            Try the devnet playground on the{" "}
            <Link href="/blocks/solana-auth" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>block detail page</Link>{" "}
            to see the full flow animated step-by-step.
          </li>
        </ol>
      </Section>

      <Section title="8. Failure modes &amp; fixes">
        <div className="space-y-5">
          {[
            { error: "WalletNotConnectedError", cause: "The wallet adapter is not connected before calling useSolanaAuth().", fix: "Wrap your app in WalletProviders and ensure the user clicks connect before sign-in." },
            { error: "Nonce not found or already consumed", cause: "The nonce expired (5-minute TTL), was already used (replay protection), or the wallet address doesn't match.", fix: "Restart the flow to generate a fresh nonce. Ensure wallet address sent to /api/solana-auth/nonce matches the address used to sign." },
            { error: "Ed25519 verification failed", cause: "The signature is invalid — either tampered in transit or the message was modified between nonce fetch and signing.", fix: "Ensure the message passed to wallet.signMessage() is exactly the string returned from the nonce endpoint, with no modifications." },
            { error: "Domain binding error: expected marrowstack.dev, got localhost", cause: "NEXT_PUBLIC_APP_URL is set to the production domain but you're testing locally.", fix: "Set NEXT_PUBLIC_APP_URL=http://localhost:3000 in .env.local for local development." },
            { error: "TypeError: Cannot read properties of undefined (reading 'signMessage')", cause: "The wallet adapter context is not available — WalletProviders is not wrapping the component.", fix: "Confirm WalletProviders is mounted in app/layout.tsx above all components that use useSolanaAuth or SignInWithSolanaButton." },
            { error: "relation 'auth_nonces' does not exist", cause: "The SQL migration has not been run.", fix: "Run the MIGRATION constant from solana-auth.tsx in Supabase SQL Editor." },
          ].map(({ error, cause, fix }) => (
            <div key={error} className="space-y-1 pb-4 border-b last:border-b-0" style={{ borderColor: "hsl(var(--metal-border))" }}>
              <p className="font-mono text-[11px]" style={{ color: "hsl(var(--status-error))" }}>{error}</p>
              <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Cause:</strong> {cause}</p>
              <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Fix:</strong> {fix}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="9. Security responsibilities">
        <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>What this block guarantees:</strong></p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Ed25519 signature verified server-side using tweetnacl — the client cannot forge a signature.</li>
          <li>Nonces are single-use (consumed atomically in a single DB update). Replay attacks are prevented.</li>
          <li>Domain binding: the SIWS message embeds your app domain. A signature obtained from a different domain is rejected.</li>
          <li>Nonces expire after 5 minutes. An attacker cannot use a nonce from an old session.</li>
          <li>All verification runs server-side in the API route — the client cannot skip it.</li>
        </ul>
        <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>What you must ensure:</strong></p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Run on HTTPS. SIWS messages sent over plaintext HTTP can be intercepted and replayed.</li>
          <li>Set <InlineCode>NEXT_PUBLIC_SOLANA_CLUSTER=mainnet-beta</InlineCode> in production. devnet is for the playground only; these clusters must never share config.</li>
          <li>Keep <InlineCode>SUPABASE_SERVICE_ROLE_KEY</InlineCode> server-side. It is only needed in the API routes, never in the client.</li>
          <li>The SIWS message includes your app domain. If you change your domain, update <InlineCode>NEXT_PUBLIC_APP_URL</InlineCode> and re-test.</li>
        </ul>
      </Section>
    </div>
  )
}
