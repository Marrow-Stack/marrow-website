import React from "react";
import type { Metadata } from "next";
import { CodeBlock, EnvTable } from "@/components/docs/CodeBlock";

export const metadata: Metadata = {
  title: "Solana Payments (USDC) — MarrowStack Docs",
  description: "Reference-keyed USDC payments with on-chain confirmation, idempotency, Solana Pay URLs, subscription scaffold, and x402 middleware.",
};

export default function SolanaPaymentsDocsPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2 text-emerald-500">
          Solana
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Solana Payments (USDC)</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Reference-keyed USDC payments with on-chain confirmation, idempotency, Solana Pay URL
          generation, a subscription scaffold, and optional x402 pay-per-request middleware.
        </p>
      </div>

      <Section title="What you get">
        <ul className="list-disc list-inside space-y-1.5 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <li><code className="font-mono text-[11px]">createPaymentIntent()</code> — generates a Solana Pay URL and stores the intent in DB.</li>
          <li><code className="font-mono text-[11px]">verifyPayment()</code> — 6-point on-chain verification before value delivery.</li>
          <li><code className="font-mono text-[11px]">getPaymentStatus()</code> — poll endpoint for confirmation status.</li>
          <li><code className="font-mono text-[11px]">usePaymentStatus()</code> — client hook that polls and fires <code className="font-mono text-[11px]">onConfirmed</code>.</li>
          <li>Subscription scaffold: <code className="font-mono text-[11px]">createSubscription()</code> and <code className="font-mono text-[11px]">chargeSubscription()</code>.</li>
          <li>Optional <code className="font-mono text-[11px]">withX402()</code> middleware for pay-per-request API gating.</li>
          <li>Two SQL tables with RLS: <code className="font-mono text-[11px]">payments</code> and <code className="font-mono text-[11px]">subscriptions</code>.</li>
        </ul>
      </Section>

      <Section title="Install">
        <CodeBlock language="bash" code={`npm i @solana/web3.js @solana/spl-token @solana/pay bs58 bignumber.js`} />
      </Section>

      <Section title="Environment">
        <EnvTable rows={[
          { name: "NEXT_PUBLIC_SOLANA_CLUSTER",   required: true,  desc: "devnet or mainnet-beta. Controls which USDC mint address is used." },
          { name: "SOLANA_TREASURY_ADDRESS",       required: true,  desc: "Your receiving wallet (base58). Payments go here." },
          { name: "SOLANA_RPC_URL",                required: false, desc: "Custom RPC (Helius/QuickNode/Alchemy recommended for production). Falls back to public clusterApiUrl." },
          { name: "NEXT_PUBLIC_SUPABASE_URL",      required: true,  desc: "Supabase project URL." },
          { name: "SUPABASE_SERVICE_ROLE_KEY",     required: true,  desc: "Service role key. Never expose client-side." },
        ]} />
        <div className="mt-3 p-3 rounded-lg text-sm" style={{ background: "rgba(255,166,87,0.08)", border: "1px solid rgba(255,166,87,0.2)", color: "#ffa657" }}>
          <strong>USDC mint addresses</strong> — verify these before going to mainnet:
          <ul className="mt-1.5 space-y-0.5 font-mono text-[11px]">
            <li>Devnet: <code>4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU</code></li>
            <li>Mainnet-beta: <code>EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v</code></li>
          </ul>
          <p className="mt-1.5 text-[11px]">Confirm at: circle.com/en/usdc/developers</p>
        </div>
      </Section>

      <Section title="Critical: verify before delivering value">
        <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.2)", color: "#f85149" }}>
          <p className="font-bold mb-2">Solana has no server-side webhooks.</p>
          <p style={{ color: "hsl(var(--accent-mineral))" }}>
            You must call <code className="font-mono text-[11px]">verifyPayment(reference)</code> on your server before
            fulfilling any order. Never trust a client-sent "paid: true" flag. The <code className="font-mono text-[11px]">usePaymentStatus</code> hook's
            <code className="font-mono text-[11px]"> onConfirmed</code> callback fires only after server verification returns OK — but your
            product delivery logic must also guard server-side.
          </p>
        </div>
      </Section>

      <Section title="Payment flow">
        <ol className="list-decimal list-inside space-y-2 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <li>Server calls <code className="font-mono text-[11px]">createPaymentIntent(&#123; amountUsdc, label, message &#125;)</code> — generates an ephemeral reference keypair and persists a <code className="font-mono text-[11px]">pending</code> record.</li>
          <li>Server returns the <code className="font-mono text-[11px]">solanaPayUrl</code> (a Solana Pay transfer request URL) to the client.</li>
          <li>Client renders the URL as a QR code (for desktop) or a deep link (for mobile). The user pays with Phantom, Solflare, or any Solana Pay-compatible wallet.</li>
          <li>Client polls <code className="font-mono text-[11px]">GET /api/solana-payments/status?reference=...</code> every 3 seconds.</li>
          <li>When the block detects a finalized transaction for the reference key, it runs <code className="font-mono text-[11px]">verifyPayment()</code> automatically and updates the DB record to <code className="font-mono text-[11px]">confirmed</code>.</li>
          <li>The status endpoint returns <code className="font-mono text-[11px]">&#123; status: 'confirmed', result: &#123; signature, payer, amountUsdc, confirmedAt &#125; &#125;</code>.</li>
        </ol>
      </Section>

      <Section title="On-chain verification: 6 checks">
        <div className="space-y-2 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          {[
            ["1. Transaction finalized", "Uses confirmed commitment; finalized is also accepted."],
            ["2. USDC mint correct", "The SPL token transferred must be exactly the USDC mint for the current cluster. Rejects other tokens."],
            ["3. Amount ≥ expected", "The transferred amount must equal or exceed the intent's amount_usdc."],
            ["4. Recipient matches", "The destination token account must be owned by SOLANA_TREASURY_ADDRESS."],
            ["5. Reference key present", "The transaction must include the ephemeral reference public key, proving it's the correct payment."],
            ["6. Not already credited", "The signature is checked against the idempotency_key index. A duplicate returns 409 ALREADY_CREDITED."],
          ].map(([check, detail]) => (
            <div key={check} className="flex gap-3">
              <span className="shrink-0 font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>{check}</span>
              <span>{detail}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Usage">
        <CodeBlock language="typescript" code={`// Server — create intent
import { createPaymentIntent } from '@/blocks/solana-payments'

const intent = await createPaymentIntent({
  amountUsdc: 49,
  label:      'Admin Block — MarrowStack',
  message:    'One-time purchase',
  metadata:   { userId: session.user.id, productId: 'admin' },
})

// intent.solanaPayUrl → render QR code
// intent.reference   → pass to client hook

// Client — poll for confirmation
import { usePaymentStatus } from '@/blocks/solana-payments'

const { state, createPayment } = usePaymentStatus({
  onConfirmed: async (result) => {
    // result.signature, result.amountUsdc, result.payer
    await fetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ reference: intent.reference }),
    })
    // Your /api/orders handler calls verifyPayment() again
    // before writing the order — defense in depth.
  },
})`} />
      </Section>

      <Section title="Subscriptions">
        <div className="p-3 rounded-lg text-sm mb-3" style={{ background: "rgba(255,166,87,0.08)", border: "1px solid rgba(255,166,87,0.2)", color: "#ffa657" }}>
          Solana has no native pull payments. This scaffold records billing cycles and generates
          new payment requests. Users must approve each payment. There are no silent recurring debits.
        </div>
        <CodeBlock language="typescript" code={`import { createSubscription, chargeSubscription } from '@/blocks/solana-payments'

// Create subscription (returns first payment intent)
const { subscriptionId, firstPaymentIntent } =
  await createSubscription(userId, {
    planId:       'pro-monthly',
    amountUsdc:   29,
    intervalDays: 30,
    label:        'Pro Plan — MarrowStack',
  })

// On billing day: generate renewal intent, send to user
const renewalIntent = await chargeSubscription(subscriptionId)
// Send renewalIntent.solanaPayUrl to user via email/notification`} />
      </Section>

      <Section title="x402 middleware (opt-in)">
        <p className="text-sm mb-3" style={{ color: "hsl(var(--accent-mineral))" }}>
          Gate an API route behind a micro-payment. The client receives 402 with a Solana Pay URL,
          pays, then retries with a proof header. Tree-shake if unused.
        </p>
        <CodeBlock language="typescript" filename="middleware.ts" code={`import { withX402 } from '@/blocks/solana-payments'
import { NextResponse } from 'next/server'

const x402 = withX402({
  amountUsdc: 0.01,
  paths:      ['/api/ai-generate'],
  label:      'AI generation — 1¢ USDC per call',
})

export async function middleware(req) {
  const res = await x402(req)
  if (res) return res          // 402 — payment required
  return NextResponse.next()   // paid — proceed
}`} />
      </Section>

      <Section title="Troubleshooting">
        <div className="space-y-3 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <div>
            <p className="font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>VALIDATION_FAILED — wrong mint</p>
            <p>The user paid with a different SPL token. The block rejects and marks the intent <code className="font-mono text-[11px]">failed</code>. Show the user the expected USDC mint address.</p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>findReference throws — transaction not found</p>
            <p>The user hasn't paid yet, or the RPC node is lagging. Continue polling. If polling exceeds 10 minutes, the intent expires.</p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>409 ALREADY_CREDITED</p>
            <p>A duplicate verify attempt for the same signature. This is the idempotency guard working correctly. Fetch the payment status from DB instead.</p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>RPC rate limits on devnet</p>
            <p>Public devnet RPC has strict rate limits. Use a private RPC (Helius free tier works) by setting <code className="font-mono text-[11px]">SOLANA_RPC_URL</code>.</p>
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
