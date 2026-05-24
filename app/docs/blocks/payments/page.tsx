import React from "react"
import type { Metadata } from "next"
import { CodeBlock, EnvTable, InlineCode } from "@/components/docs/CodeBlock"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Payments — Integration Guide — MarrowStack",
  description: "Integration walkthrough for the MarrowStack Payments block: PayPal Checkout v2, order creation, capture, refunds, webhook verification.",
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

export default function PaymentsDocsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Monetization · Intermediate
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Payments</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          PayPal Checkout v2 for one-time payments — order creation, capture, refunds, webhook verification,
          and INR display helpers with a module-level token cache. Lighter than the full Billing block;
          use this when you only need one-time charges with no subscription management.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">Read the Getting Access guide</Link> if you haven&apos;t yet.
        </p>
      </div>

      <Section title="1. Get the file">
        <p>
          Sign in at marrowstack.dev, open the{" "}
          <Link href="/blocks/payments" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>Payments block</Link>,
          and click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          Paste <InlineCode>lib/payments.ts</InlineCode> into your project. The block maintains a module-level
          OAuth2 token cache — each cold-start fetches a fresh token automatically.
        </p>
      </Section>

      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>PayPal Developer account with a REST API app (sandbox for dev, live for production)</li>
          <li>A publicly accessible webhook endpoint (use ngrok or a preview deployment for local dev)</li>
        </ul>
      </Section>

      <Section title="3. Install">
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>Copy <InlineCode>lib/payments.ts</InlineCode> from the block detail page into your project.</li>
          <li>Install peer dependencies:</li>
        </ol>
        <CodeBlock language="bash" code={`npm install zod`} />
      </Section>

      <Section title="4. Environment">
        <EnvTable rows={[
          { name: "PAYPAL_CLIENT_ID",     required: true,  desc: "PayPal REST API client ID" },
          { name: "PAYPAL_CLIENT_SECRET", required: true,  desc: "PayPal REST API client secret — server-side only" },
          { name: "PAYPAL_WEBHOOK_ID",    required: true,  desc: "Webhook ID from PayPal Developer Dashboard → Webhooks" },
          { name: "PAYPAL_MODE",          required: false, desc: "sandbox or live. Defaults to sandbox" },
        ]} />
      </Section>

      <Section title="5. Wire it in">
        <CodeBlock filename="app/api/checkout/route.ts" code={`import { createOrder, captureOrder } from '@/lib/payments'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// POST — create order, return PayPal order ID to client
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  const { amountUsd, description } = await req.json()
  const order = await createOrder({ amountUsd, description })
  return NextResponse.json({ orderId: order.id })
}

// PATCH — capture after buyer approves in PayPal UI
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  const { orderId } = await req.json()
  const capture = await captureOrder(orderId)

  if (capture.status === 'COMPLETED') {
    // Deliver value here — only runs after server-side capture confirmation
  }

  return NextResponse.json({ status: capture.status })
}`} />

        <CodeBlock filename="app/api/checkout/webhook/route.ts" code={`import { verifyWebhookSignature } from '@/lib/payments'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headers = Object.fromEntries(req.headers.entries())

  const valid = await verifyWebhookSignature(body, headers)
  if (!valid) return new NextResponse('Bad signature', { status: 400 })

  const event = JSON.parse(body)
  // Handle event.event_type: PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.REFUNDED, etc.
  return NextResponse.json({ ok: true })
}`} />
      </Section>

      <Section title="6. Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Call <InlineCode>createOrder(&#123; amountUsd: 10, description: 'test' &#125;)</InlineCode> and confirm you receive a PayPal order ID.</li>
          <li>Complete the PayPal sandbox checkout and call <InlineCode>captureOrder(orderId)</InlineCode> — status should be <InlineCode>COMPLETED</InlineCode>.</li>
          <li>Send a test webhook from the PayPal sandbox simulator and confirm <InlineCode>verifyWebhookSignature()</InlineCode> returns <InlineCode>true</InlineCode>.</li>
        </ol>
      </Section>

      <Section title="7. Failure modes &amp; fixes">
        <div className="space-y-5">
          {[
            { error: "INVALID_CLIENT", cause: "Wrong PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET, or sandbox credentials used with PAYPAL_MODE=live.", fix: "Copy credentials from PayPal Developer Dashboard. Ensure PAYPAL_MODE matches." },
            { error: "ORDER_ALREADY_CAPTURED", cause: "captureOrder() was called twice for the same order ID.", fix: "Check your order state before calling capture. Use a database column to track captured orders." },
            { error: "Webhook signature mismatch", cause: "The body was parsed as JSON before passing to verifyWebhookSignature(), or PAYPAL_WEBHOOK_ID is wrong.", fix: "Pass the raw string body (req.text()) directly to verifyWebhookSignature()." },
          ].map(({ error, cause, fix }) => (
            <div key={error} className="space-y-1 pb-4 border-b last:border-b-0" style={{ borderColor: "hsl(var(--metal-border))" }}>
              <p className="font-mono text-[11px]" style={{ color: "hsl(var(--status-error))" }}>{error}</p>
              <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Cause:</strong> {cause}</p>
              <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Fix:</strong> {fix}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
