import React from "react"
import type { Metadata } from "next"
import { CodeBlock, EnvTable, InlineCode } from "@/components/docs/CodeBlock"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Solana Payments (USDC) — Integration Guide — MarrowStack",
  description: "Integration walkthrough for the MarrowStack Solana Payments block: reference-keyed USDC transfers, 6-point on-chain verification, idempotency, x402 middleware.",
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

export default function SolanaPaymentsDocsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2 text-emerald-500">Solana</p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Solana Payments (USDC)</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Reference-keyed USDC payments with 6-point on-chain verification, idempotency,
          a subscription scaffold, and optional x402 pay-per-request middleware. Devnet playground
          available on the block detail page — this guide is for{" "}
          <strong style={{ color: "hsl(var(--metal-foreground))" }}>mainnet-beta production</strong> use.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">Read the Getting Access guide</Link> if you haven&apos;t yet.
        </p>
      </div>

      <Section title="1. Get the file">
        <p>
          Sign in at marrowstack.dev, open the{" "}
          <Link href="/blocks/solana-payments" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>Solana Payments block</Link>,
          and click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          Paste <InlineCode>lib/solana-payments.ts</InlineCode> (~500 lines) into your project. Exports:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li><InlineCode>createPaymentRequest()</InlineCode> — generates a reference keypair and a payment URI</li>
          <li><InlineCode>verifyPayment()</InlineCode> — 6-point on-chain verification (confirmed, recipient, amount, mint, reference, unexpired)</li>
          <li><InlineCode>PaymentButton</InlineCode> — React component (wallet adapter required)</li>
          <li><InlineCode>usePaymentStatus()</InlineCode> — polls for payment confirmation</li>
          <li><InlineCode>withPaymentGate()</InlineCode> — optional x402 pay-per-request middleware</li>
          <li>SQL migration: <InlineCode>payments</InlineCode> and <InlineCode>subscriptions</InlineCode> tables</li>
        </ul>
        <div
          className="p-3 rounded-xl text-xs"
          style={{ background: "rgba(210,153,34,0.1)", border: "1px solid rgba(210,153,34,0.2)", color: "hsl(var(--status-warning))" }}
        >
          <strong>Mainnet vs. devnet:</strong> The playground on the block detail page runs on devnet
          with simulated USDC. Production use requires <InlineCode>SOLANA_CLUSTER=mainnet-beta</InlineCode>{" "}
          and the real USDC mint (<InlineCode>EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v</InlineCode>).
          These configs must never be mixed.
        </div>
      </Section>

      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>Supabase project</li>
          <li>A Solana treasury wallet (the public key that receives USDC)</li>
          <li>A mainnet-beta RPC endpoint (Helius, QuickNode, or similar)</li>
          <li>Wallet adapter (if using the <InlineCode>PaymentButton</InlineCode> component)</li>
        </ul>
      </Section>

      <Section title="3. Install">
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>Copy the file from the block detail page and paste it into <InlineCode>lib/solana-payments.ts</InlineCode>.</li>
          <li>Remove <InlineCode>@ts-nocheck</InlineCode> from line 1.</li>
          <li>Install peer dependencies:</li>
        </ol>
        <CodeBlock language="bash" code={`npm install @solana/web3.js @solana/spl-token bs58
# If using PaymentButton (wallet adapter):
npm install @solana/wallet-adapter-base @solana/wallet-adapter-react \\
    @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets`} />
      </Section>

      <Section title="4. Environment">
        <EnvTable rows={[
          { name: "NEXT_PUBLIC_SUPABASE_URL",    required: true,  desc: "Your Supabase project URL" },
          { name: "SUPABASE_SERVICE_ROLE_KEY",   required: true,  desc: "Service role key — server-side only" },
          { name: "SOLANA_CLUSTER",              required: true,  default: "mainnet-beta", desc: "Must be mainnet-beta in production. Never devnet." },
          { name: "SOLANA_RPC_URL",              required: true,  desc: "Mainnet RPC endpoint. The public endpoint is rate-limited; use Helius or QuickNode." },
          { name: "TREASURY_WALLET_ADDRESS",     required: true,  desc: "Public key of the wallet that receives USDC payments." },
          { name: "USDC_MINT",                   required: true,  default: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", desc: "USDC mint address on mainnet. Do not change unless you know what you are doing." },
          { name: "PAYMENT_EXPIRY_SECONDS",      required: false, default: "600", desc: "How long a payment request is valid before expiry. Default is 10 minutes." },
        ]} />
      </Section>

      <Section title="5. Database">
        <p>
          Run the <InlineCode>MIGRATION</InlineCode> constant from <InlineCode>solana-payments.ts</InlineCode> in Supabase SQL Editor.
        </p>
        <p>Creates:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li><InlineCode>payments</InlineCode> — reference key, amount, status, tx signature, idempotency guard</li>
          <li><InlineCode>subscriptions</InlineCode> — optional recurring payment scaffold with renewal tracking</li>
        </ul>
        <p>RLS on both tables: service role has full access; anon is blocked.</p>
      </Section>

      <Section title="6. Wire it in">
        <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Create a payment request (server-side):</strong></p>
        <CodeBlock filename="app/api/payment/create/route.ts" code={`import { createPaymentRequest } from '@/lib/solana-payments'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { amount, userId } = await req.json()
  // amount is in USDC (e.g. 49 for $49)
  const payment = await createPaymentRequest({
    amount,
    userId,
    description: 'MarrowStack block purchase',
  })
  // payment.referenceKey — unique key for this payment
  // payment.paymentUri   — Solana Pay URI for QR codes
  // payment.expiresAt    — ISO timestamp
  return NextResponse.json(payment)
}`} />
        <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Verify payment (server-side, called after buyer pays):</strong></p>
        <CodeBlock filename="app/api/payment/verify/route.ts" code={`import { verifyPayment } from '@/lib/solana-payments'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { paymentId, txSignature } = await req.json()
  const result = await verifyPayment({ paymentId, txSignature })
  // result.verified — boolean
  // result.error    — string if verification failed
  if (!result.verified) {
    return NextResponse.json({ error: result.error }, { status: 422 })
  }
  // Mark order as paid, trigger delivery, etc.
  return NextResponse.json({ ok: true })
}`} />
        <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Drop in the PaymentButton (client-side):</strong></p>
        <CodeBlock filename="app/checkout/page.tsx" code={`'use client'
import { PaymentButton } from '@/lib/solana-payments'

export default function CheckoutPage({ paymentUri }: { paymentUri: string }) {
  return (
    <PaymentButton
      paymentUri={paymentUri}
      onSuccess={(txSig) => fetch('/api/payment/verify', {
        method: 'POST',
        body: JSON.stringify({ txSignature: txSig }),
      })}
      onError={(err) => console.error(err)}
    />
  )
}`} />
      </Section>

      <Section title="7. Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>
            Call <InlineCode>createPaymentRequest(&#123; amount: 1, userId: &apos;test&apos; &#125;)</InlineCode> in a test route.
            Confirm a row appears in the <InlineCode>payments</InlineCode> table with status <InlineCode>pending</InlineCode>.
          </li>
          <li>
            Use the devnet{" "}
            <Link href="/blocks/solana-payments" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>playground</Link>{" "}
            to test the full payment flow before spending real USDC on mainnet.
          </li>
          <li>
            On mainnet: send the exact USDC amount to the treasury address and call
            <InlineCode>verifyPayment()</InlineCode> with the tx signature. Confirm the
            <InlineCode>payments</InlineCode> row transitions to <InlineCode>verified</InlineCode>.
          </li>
          <li>
            Attempt to verify the same tx signature a second time.
            <InlineCode>verifyPayment()</InlineCode> must return <InlineCode>&#123; verified: false, error: &apos;Already processed&apos; &#125;</InlineCode> (idempotency guard).
          </li>
        </ol>
      </Section>

      <Section title="8. Failure modes &amp; fixes">
        <div className="space-y-5">
          {[
            { error: "Transaction not found", cause: "The tx signature was queried before the transaction finalized on-chain.", fix: "Add a 2–5 second delay and retry once. Transactions on mainnet typically confirm within 1–2 slots (~800ms) but can take longer under load." },
            { error: "Amount mismatch: expected 49.00, received 48.51", cause: "Buyer sent slightly less than the required amount (wallet fee deducted from the transfer amount).", fix: "Set the transfer amount to USDC (stable, no fee deduction). If using SOL, the tolerance band in verifyPayment() handles this — widen it in the config if needed." },
            { error: "Wrong recipient: expected <treasury>, got <other>", cause: "Buyer sent USDC to a different address.", fix: "Ensure the UI clearly displays the treasury address. Surface the exact address as a copy field — never rely on the buyer to remember it." },
            { error: "Mint mismatch", cause: "Buyer sent a different SPL token (not USDC).", fix: "verifyPayment() checks the mint against USDC_MINT. The block rejects non-USDC transfers. Show the USDC mint address in the payment UI." },
            { error: "PaymentExpiredError", cause: "The payment was not completed within the PAYMENT_EXPIRY_SECONDS window.", fix: "Create a new payment request. The expiry window is configurable. For large amounts, consider increasing PAYMENT_EXPIRY_SECONDS." },
            { error: "RPC 429 Too Many Requests", cause: "Using the public Solana RPC endpoint, which has aggressive rate limits.", fix: "Switch to a dedicated mainnet endpoint: Helius (https://helius.dev) or QuickNode. Set SOLANA_RPC_URL accordingly." },
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
          <li>6-point on-chain verification: confirmed finality, exact recipient, exact amount (within tolerance), correct USDC mint, unique reference key, within expiry window.</li>
          <li>Reference keys are single-use. The <InlineCode>payments</InlineCode> table has a unique constraint on reference keys — double-payment is rejected.</li>
          <li>Verification runs server-side. The client submits a tx signature; the server does not trust the client&apos;s claim that payment was made.</li>
          <li>All verification happens before any value is delivered. Never deliver before <InlineCode>verifyPayment()</InlineCode> returns <InlineCode>verified: true</InlineCode>.</li>
        </ul>
        <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>What you must ensure:</strong></p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>
            <strong>Verify payment server-side before delivering value</strong> — this is the most important rule.
            Call <InlineCode>verifyPayment()</InlineCode> in your API route, not on the client.
          </li>
          <li>Set <InlineCode>SOLANA_CLUSTER=mainnet-beta</InlineCode>. Never use devnet config in production.</li>
          <li>Keep <InlineCode>TREASURY_WALLET_ADDRESS</InlineCode> and <InlineCode>SUPABASE_SERVICE_ROLE_KEY</InlineCode> server-side only.</li>
          <li>Use a dedicated RPC endpoint in production. Public endpoints are rate-limited and unreliable under load.</li>
          <li>Display the USDC mint address to users so they can verify they are sending the correct token.</li>
        </ul>
      </Section>
    </div>
  )
}
