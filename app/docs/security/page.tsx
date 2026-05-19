import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Model — MarrowStack Docs",
  description: "What MarrowStack blocks guarantee, what is the buyer's responsibility, and the verify-before-deliver rule.",
};

export default function SecurityDocsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Security Model</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          MarrowStack blocks make specific, testable security guarantees. This page documents what those
          guarantees are, what is explicitly outside their scope, and what you must implement on your side.
        </p>
      </div>

      <Section title="What the blocks guarantee">
        <div className="space-y-4 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <Guarantee title="Passwords are never stored in plaintext">
            The Auth block hashes passwords with bcrypt before writing to the database. The plaintext value
            is never logged, returned, or stored. The work factor defaults to 12 rounds (configurable up, not down below 10).
          </Guarantee>
          <Guarantee title="Cryptographic verification is server-side only">
            For SIWS (Solana Auth), Ed25519 signature verification runs on the server using tweetnacl.
            The block never trusts a client claim that verification succeeded. For payments, on-chain verification
            runs via your RPC before any value-delivery path is reached.
          </Guarantee>
          <Guarantee title="Nonces and tokens are single-use">
            Auth nonces are consumed atomically with a conditional UPDATE (<code className="font-mono text-[11px]">WHERE consumed_at IS NULL</code>).
            A second verify attempt with the same nonce returns 409. Invite tokens work identically.
          </Guarantee>
          <Guarantee title="Idempotency on payments">
            The payment signature is stored in an <code className="font-mono text-[11px]">idempotency_key UNIQUE</code> column.
            A duplicate verify attempt for the same on-chain transaction returns 409 ALREADY_CREDITED rather than double-crediting.
          </Guarantee>
          <Guarantee title="Row-Level Security on all tables">
            Every SQL migration enables RLS and sets policies. Service role operations (server-side) bypass RLS intentionally.
            Client-side Supabase access (if you add it) is constrained by RLS policies.
          </Guarantee>
          <Guarantee title="Domain binding in SIWS">
            The Solana Auth block checks the <code className="font-mono text-[11px]">domain</code> field in every SIWS message against
            <code className="font-mono text-[11px]"> SOLANA_AUTH_DOMAIN</code>. A mismatch rejects the request. This prevents
            cross-origin replay attacks.
          </Guarantee>
          <Guarantee title="Brute-force lockout">
            The Auth block tracks failed login attempts per IP. After <code className="font-mono text-[11px]">MAX_LOGIN_ATTEMPTS</code> failures
            within <code className="font-mono text-[11px]">LOCKOUT_WINDOW_MINUTES</code>, that IP is blocked until the window expires.
          </Guarantee>
        </div>
      </Section>

      <Section title="Verify before delivering value">
        <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.2)", color: "#f85149" }}>
          <p className="font-bold mb-2">This is the most important rule for Solana payments.</p>
          <p style={{ color: "hsl(var(--accent-mineral))" }}>
            The <code className="font-mono text-[11px]">usePaymentStatus</code> hook fires <code className="font-mono text-[11px]">onConfirmed</code> only after
            the status API returns <code className="font-mono text-[11px]">confirmed</code>, which itself only fires after server-side
            <code className="font-mono text-[11px]"> verifyPayment()</code> passes all 6 checks. Despite this,{" "}
            <strong>your product delivery logic must independently call <code className="font-mono text-[11px]">verifyPayment()</code>
            or check the DB status before writing the order</strong>. Defense in depth: if the client call is
            intercepted or replayed, your server is the last line of defense.
          </p>
        </div>
      </Section>

      <Section title="What is your responsibility">
        <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <li><strong style={{ color: "hsl(var(--metal-foreground))" }}>HTTPS everywhere.</strong> The blocks do not enforce transport security — your infrastructure must serve over TLS. SIWS signatures over plain HTTP are trivially interceptable.</li>
          <li><strong style={{ color: "hsl(var(--metal-foreground))" }}>Secret management.</strong> Never expose <code className="font-mono text-[11px]">SUPABASE_SERVICE_ROLE_KEY</code>, <code className="font-mono text-[11px]">NEXTAUTH_SECRET</code>, or <code className="font-mono text-[11px]">SMTP_PASS</code> to the client. Use Next.js server-only env vars (no <code className="font-mono text-[11px]">NEXT_PUBLIC_</code> prefix) for all secrets.</li>
          <li><strong style={{ color: "hsl(var(--metal-foreground))" }}>RPC reliability.</strong> For Solana payments in production, use a private RPC (Helius, QuickNode, Alchemy). Public devnet and mainnet RPCs have aggressive rate limits that will cause confirmation polling to fail under load.</li>
          <li><strong style={{ color: "hsl(var(--metal-foreground))" }}>USDC mint address verification.</strong> Before going to mainnet, verify the USDC mint addresses against Circle's official documentation. The block ships with the correct addresses at time of writing, but you must confirm them for your deployment.</li>
          <li><strong style={{ color: "hsl(var(--metal-foreground))" }}>Nonce TTL lower bound.</strong> Do not set <code className="font-mono text-[11px]">SOLANA_AUTH_NONCE_TTL_SECONDS</code> below 60. Very short windows cause legitimate users to fail the timestamp check on slow connections.</li>
          <li><strong style={{ color: "hsl(var(--metal-foreground))" }}>Admin route authorization.</strong> The Admin block's <code className="font-mono text-[11px]">requireAdmin()</code> must be called at the top of every admin route handler and server component. The block does not apply middleware-level protection.</li>
          <li><strong style={{ color: "hsl(var(--metal-foreground))" }}>Dependency updates.</strong> You own the block file. Monitor <code className="font-mono text-[11px]">@solana/web3.js</code>, <code className="font-mono text-[11px]">tweetnacl</code>, <code className="font-mono text-[11px]">next-auth</code>, and <code className="font-mono text-[11px]">bcryptjs</code> for security advisories.</li>
        </ul>
      </Section>

      <Section title="Out of scope">
        <p className="text-sm mb-3" style={{ color: "hsl(var(--accent-mineral))" }}>
          The following are not covered by any block and must be implemented at the infrastructure or application layer:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <li>DDoS protection (use Cloudflare or your CDN's WAF)</li>
          <li>Rate limiting at the network edge (beyond the per-IP lockout in the Auth block)</li>
          <li>Content Security Policy headers</li>
          <li>CORS policy enforcement</li>
          <li>Database backups and point-in-time recovery</li>
          <li>Solana validator-level MEV resistance (private RPC helps at the RPC layer)</li>
        </ul>
      </Section>

      <Section title="Reporting issues">
        <p className="text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          The two Solana blocks are MIT-licensed and open source. Report security issues by email to{" "}
          <code className="font-mono text-[11px]">security@marrowstack.dev</code>. For the web2 blocks,
          use the same address. Please do not file public GitHub issues for security vulnerabilities.
        </p>
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

function Guarantee({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div
        className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: "#3fb950", marginTop: "6px" }}
      />
      <div>
        <p className="font-semibold mb-1" style={{ color: "hsl(var(--metal-foreground))" }}>{title}</p>
        <p>{children}</p>
      </div>
    </div>
  );
}
