import React from "react";
import type { Metadata } from "next";
import { CodeBlock, EnvTable } from "@/components/docs/CodeBlock";

export const metadata: Metadata = {
  title: "Solana Auth (SIWS) — MarrowStack Docs",
  description: "Sign-In-With-Solana: Ed25519 signature verification, single-use nonces, domain binding, and wallet↔account linking for Next.js + Supabase.",
};

export default function SolanaAuthDocsPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2 text-emerald-500">
          Solana
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Solana Auth (SIWS)</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Sign-In-With-Solana with server-side Ed25519 verification, single-use nonces, domain binding,
          RBAC, and wallet↔email account linking.
        </p>
      </div>

      <Section title="What you get">
        <ul className="list-disc list-inside space-y-1.5 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <li>A <code className="font-mono text-[11px]">useSolanaAuth()</code> React hook that orchestrates connect → sign → verify in one call.</li>
          <li>A <code className="font-mono text-[11px]">SignInWithSolanaButton</code> drop-in component for Phantom, Solflare, and Backpack.</li>
          <li>Two API route handlers: <code className="font-mono text-[11px]">/api/solana-auth/nonce</code> and <code className="font-mono text-[11px]">/api/solana-auth/verify</code>.</li>
          <li>Two SQL tables: <code className="font-mono text-[11px]">auth_nonces</code> (challenges) and <code className="font-mono text-[11px]">wallets</code> (account links), both with RLS.</li>
          <li>A <code className="font-mono text-[11px]">WalletProviders</code> context wrapper for the wallet-adapter connection layer.</li>
          <li>A <code className="font-mono text-[11px]">buildSolanaCredentialsProvider()</code> stub to slot the wallet into an existing NextAuth config.</li>
        </ul>
      </Section>

      <Section title="Install">
        <ol className="list-decimal list-inside space-y-2 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <li>Copy <code className="font-mono text-[11px]">blocks/solana-auth/solana-auth.tsx</code> into your project.</li>
          <li>Run the SQL migration (MIGRATION constant at the top of the file) in Supabase SQL Editor.</li>
          <li>Install dependencies.</li>
          <li>Set env vars.</li>
          <li>Mount <code className="font-mono text-[11px]">WalletProviders</code> in <code className="font-mono text-[11px]">app/layout.tsx</code>.</li>
          <li>Mount the two API routes.</li>
          <li>Drop <code className="font-mono text-[11px]">SignInWithSolanaButton</code> wherever sign-in lives.</li>
        </ol>
        <CodeBlock language="bash" code={`npm i @solana/web3.js bs58 tweetnacl
npm i @solana/wallet-adapter-base @solana/wallet-adapter-react \\
    @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets`} />
      </Section>

      <Section title="Environment">
        <EnvTable rows={[
          { name: "NEXT_PUBLIC_SOLANA_CLUSTER",    required: true,  desc: "devnet or mainnet-beta" },
          { name: "SOLANA_AUTH_DOMAIN",             required: true,  desc: "Domain bound into every SIWS message. Server rejects any message with a different domain." },
          { name: "SOLANA_AUTH_NONCE_TTL_SECONDS",  required: false, default: "300", desc: "TTL for issued nonces. Do not set below 60." },
          { name: "NEXT_PUBLIC_APP_URL",            required: true,  desc: "Full origin URL; used as the URI field in the SIWS message." },
          { name: "NEXT_PUBLIC_SUPABASE_URL",       required: true,  desc: "Your Supabase project URL." },
          { name: "SUPABASE_SERVICE_ROLE_KEY",      required: true,  desc: "Service role key. Never expose to the client." },
        ]} />
      </Section>

      <Section title="Authentication flow">
        <ol className="list-decimal list-inside space-y-2 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <li>Client calls <code className="font-mono text-[11px]">POST /api/solana-auth/nonce</code> with the wallet address → server issues a random 32-char hex nonce, stored in <code className="font-mono text-[11px]">auth_nonces</code> with <code className="font-mono text-[11px]">expires_at</code> and <code className="font-mono text-[11px]">consumed_at = null</code>.</li>
          <li>Client builds a standards-compliant SIWS message embedding the nonce, domain, URI, chain ID, and timestamp.</li>
          <li>User signs the message in their wallet (SIWS standard or <code className="font-mono text-[11px]">signMessage</code> fallback).</li>
          <li>Client sends address + message + base58 signature to <code className="font-mono text-[11px]">POST /api/solana-auth/verify</code>.</li>
          <li>Server runs all checks (see Security Guarantees below) and on success mints a session. The wallet is linked to the user's account in the <code className="font-mono text-[11px]">wallets</code> table.</li>
        </ol>
      </Section>

      <Section title="Wiring into existing NextAuth">
        <CodeBlock language="typescript" filename="app/api/auth/[...nextauth]/route.ts" code={`import { authOptions }                  from '@/blocks/auth'
import { buildSolanaCredentialsProvider } from '@/blocks/solana-auth'
import NextAuth                           from 'next-auth'

const handler = NextAuth({
  ...authOptions,
  providers: [
    ...authOptions.providers,
    buildSolanaCredentialsProvider(),
  ],
})

export { handler as GET, handler as POST }`} />
      </Section>

      <Section title="Drop-in usage">
        <CodeBlock language="tsx" code={`// app/layout.tsx
import { WalletProviders } from '@/blocks/solana-auth'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WalletProviders>{children}</WalletProviders>
      </body>
    </html>
  )
}

// app/signin/page.tsx
import { SignInWithSolanaButton } from '@/blocks/solana-auth'
import { useRouter }              from 'next/navigation'

export default function SignInPage() {
  const router = useRouter()
  return (
    <SignInWithSolanaButton
      onSuccess={(session) => router.push('/dashboard')}
      onError={(err) => console.error(err.message)}
    />
  )
}`} />
      </Section>

      <Section title="Security guarantees">
        <div className="space-y-3 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Signature verification is server-side only.</strong> The block never trusts a client claim that verification succeeded.</p>
          <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Nonces are single-use.</strong> The <code className="font-mono text-[11px]">consumed_at</code> column is set atomically via an UPDATE with a WHERE clause that checks <code className="font-mono text-[11px]">consumed_at IS NULL</code>. A second verify attempt with the same nonce returns 409.</p>
          <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Domain binding.</strong> The server checks the <code className="font-mono text-[11px]">domain</code> field in the parsed SIWS message against <code className="font-mono text-[11px]">SOLANA_AUTH_DOMAIN</code>. A mismatch returns 403. This prevents a phishing site from tricking a user into signing a message for your domain.</p>
          <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Chain ID binding.</strong> The cluster (<code className="font-mono text-[11px]">devnet</code> / <code className="font-mono text-[11px]">mainnet</code>) is checked. A signature produced on devnet cannot be replayed on mainnet.</p>
          <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Timestamp window.</strong> Messages older than <code className="font-mono text-[11px]">SOLANA_AUTH_NONCE_TTL_SECONDS</code> are rejected even if the nonce is valid. This limits the window for stolen-signature attacks.</p>
          <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>No PII in logs.</strong> The block logs error codes, not user addresses or session data.</p>
          <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Buyer responsibility.</strong> You must serve the app over HTTPS. You must not weaken the nonce TTL below 60 seconds. You must not expose <code className="font-mono text-[11px]">SUPABASE_SERVICE_ROLE_KEY</code> to the client.</p>
        </div>
      </Section>

      <Section title="Edge cases">
        <div className="space-y-2.5 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Wallet without SIWS support.</strong> The hook checks for the <code className="font-mono text-[11px]">solanaSignIn</code> method on the adapter and falls back to <code className="font-mono text-[11px]">signMessage</code> automatically. The fallback is slightly less secure (no binding to the wallet's canonical identity) but is fully supported by all major wallets.</p>
          <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Wallet already linked to another account.</strong> <code className="font-mono text-[11px]">linkWalletToUser</code> returns <code className="font-mono text-[11px]">WALLET_CONFLICT 409</code>. The error message does not leak the other account's identifier.</p>
          <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Clock skew.</strong> If the user's clock is more than <code className="font-mono text-[11px]">SOLANA_AUTH_NONCE_TTL_SECONDS</code> behind the server, the <code className="font-mono text-[11px]">issuedAt</code> check returns 401. Prompt the user to sync their clock.</p>
          <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>User connects but rejects signing.</strong> The hook catches the rejection and sets <code className="font-mono text-[11px]">state.status = 'error'</code> with a descriptive message. No nonce is consumed; the user can retry.</p>
        </div>
      </Section>

      <Section title="Troubleshooting">
        <div className="space-y-3 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <div>
            <p className="font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>403 DOMAIN_MISMATCH</p>
            <p>The domain in the SIWS message does not match <code className="font-mono text-[11px]">SOLANA_AUTH_DOMAIN</code>. Ensure the env var is set to <em>exactly</em> the host (e.g. <code className="font-mono text-[11px]">app.example.com</code>, not <code className="font-mono text-[11px]">https://app.example.com</code>).</p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>409 REPLAY</p>
            <p>The nonce was already consumed. This is expected for repeated verify attempts. It should not occur in normal usage — if it does, check for client-side double-submit bugs.</p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>401 INVALID_SIGNATURE</p>
            <p>Ed25519 verification failed. Ensure the client is encoding the signature as base58 before sending. Check that the message string is identical on both sides (no extra whitespace or encoding differences).</p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>Nonce not found in DB</p>
            <p>The nonce endpoint must be called before the verify endpoint. If using Supabase's connection pooler, ensure the nonce INSERT and the verify UPDATE land on the same primary.</p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>WalletProviders causes SSR errors</p>
            <p>Wrap it in <code className="font-mono text-[11px]">dynamic(() =&gt; import('./WalletWrapper'), {'{ ssr: false }'})</code> if your layout is server-rendered and the wallet adapter causes hydration issues.</p>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold" style={{ color: "hsl(var(--metal-foreground))" }}>{title}</h2>
      {children}
    </div>
  );
}
