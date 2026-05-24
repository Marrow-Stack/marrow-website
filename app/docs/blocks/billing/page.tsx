import React from "react"
import type { Metadata } from "next"
import { CodeBlock, EnvTable, InlineCode } from "@/components/docs/CodeBlock"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Billing & Subscriptions — Integration Guide — MarrowStack",
  description: "Integration walkthrough for the MarrowStack Billing block: PayPal REST API, one-time orders, subscriptions, refunds, webhook verification.",
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

export default function BillingDocsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Monetization · Advanced
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Billing &amp; Subscriptions</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          PayPal REST API integration for one-time orders, monthly and yearly subscriptions, refunds,
          webhook verification, usage tracking, and invoice generation — wired to Supabase.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">Read the Getting Access guide</Link> if you haven&apos;t yet.
        </p>
      </div>

      <Section title="1. Get the file">
        <p>
          Sign in at marrowstack.dev, open the{" "}
          <Link href="/blocks/billing" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>Billing &amp; Subscriptions block</Link>,
          and click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          Paste <InlineCode>lib/billing.ts</InlineCode> into your project.
        </p>
        <div className="p-3 rounded-xl text-xs" style={{ background: "hsl(var(--status-warning) / 0.10)", border: "1px solid hsl(var(--status-warning) / 0.20)", color: "hsl(var(--status-warning))" }}>
          Set <InlineCode>PAYPAL_MODE=sandbox</InlineCode> during development. Switch to <InlineCode>live</InlineCode> and update your webhook URL before going to production. Never use live credentials in development.
        </div>
      </Section>

      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>PayPal Developer account — create a REST API app at <InlineCode>developer.paypal.com</InlineCode></li>
          <li>Supabase project</li>
          <li>A publicly accessible webhook URL (use ngrok for local dev)</li>
        </ul>
      </Section>

      <Section title="3. Install">
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>Copy <InlineCode>lib/billing.ts</InlineCode> from the block detail page into your project.</li>
          <li>Install peer dependencies:</li>
        </ol>
        <CodeBlock language="bash" code={`npm install @supabase/supabase-js zod`} />
      </Section>

      <Section title="4. Environment">
        <EnvTable rows={[
          { name: "PAYPAL_CLIENT_ID",           required: true,  desc: "PayPal REST API client ID" },
          { name: "PAYPAL_CLIENT_SECRET",       required: true,  desc: "PayPal REST API client secret — server-side only" },
          { name: "PAYPAL_WEBHOOK_ID",          required: true,  desc: "Webhook ID from PayPal Developer Dashboard → Webhooks" },
          { name: "PAYPAL_MODE",                required: false, desc: "sandbox or live. Defaults to sandbox" },
          { name: "NEXT_PUBLIC_SUPABASE_URL",   required: true,  desc: "Your Supabase project URL" },
          { name: "SUPABASE_SERVICE_ROLE_KEY",  required: true,  desc: "Service role key — server-side only" },
        ]} />
      </Section>

      <Section title="5. Database">
        <p>
          Run the <InlineCode>MIGRATION</InlineCode> constant in Supabase SQL Editor. Creates:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><InlineCode>orders</InlineCode> — one-time PayPal orders with status tracking</li>
          <li><InlineCode>subscriptions</InlineCode> — PayPal subscription IDs, plan, billing cycle, status</li>
          <li><InlineCode>invoices</InlineCode> — generated invoice records linked to orders/subscriptions</li>
        </ul>
      </Section>

      <Section title="6. Wire it in">
        <CodeBlock filename="app/api/billing/order/route.ts" code={`import { createOrder, captureOrder } from '@/lib/billing'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// POST — create a PayPal order
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  const { amountUsd, description } = await req.json()
  const order = await createOrder({ userId: session.user.id, amountUsd, description })
  // Return the PayPal order ID to the client — use it to launch the PayPal button
  return NextResponse.json({ orderId: order.id })
}

// PATCH — capture after buyer approves
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  const { orderId } = await req.json()
  const result = await captureOrder(orderId)
  // Deliver value only after capture succeeds
  return NextResponse.json(result)
}`} />

        <CodeBlock filename="app/api/billing/webhook/route.ts" code={`import { verifyWebhook, handleWebhookEvent } from '@/lib/billing'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headers = Object.fromEntries(req.headers.entries())

  const isValid = await verifyWebhook(body, headers)
  if (!isValid) return new NextResponse('Invalid signature', { status: 400 })

  const event = JSON.parse(body)
  await handleWebhookEvent(event)
  return NextResponse.json({ ok: true })
}`} />
      </Section>

      <Section title="7. Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Create a sandbox order and confirm a row appears in the <InlineCode>orders</InlineCode> table with status <InlineCode>created</InlineCode>.</li>
          <li>Complete the PayPal sandbox checkout flow and confirm the order status transitions to <InlineCode>captured</InlineCode>.</li>
          <li>Use the PayPal sandbox webhook simulator to send a <InlineCode>PAYMENT.CAPTURE.COMPLETED</InlineCode> event — confirm <InlineCode>verifyWebhook()</InlineCode> passes.</li>
          <li>Create a test subscription and confirm a row appears in <InlineCode>subscriptions</InlineCode>.</li>
        </ol>
      </Section>

      <Section title="8. Failure modes &amp; fixes">
        <div className="space-y-5">
          {[
            { error: "INVALID_CLIENT — client authentication failed", cause: "PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET is wrong, or you're using live credentials in sandbox mode.", fix: "Check credentials in PayPal Developer Dashboard. Ensure PAYPAL_MODE matches the app type (sandbox/live)." },
            { error: "Webhook signature verification failed", cause: "PAYPAL_WEBHOOK_ID is wrong, or the webhook body was modified in transit.", fix: "Copy the exact Webhook ID from PayPal Developer Dashboard → Webhooks. Don't modify the raw body before passing to verifyWebhook()." },
            { error: "ORDER_NOT_APPROVED", cause: "Attempting to capture an order before the buyer has approved it in the PayPal flow.", fix: "Only call captureOrder() after the PayPal JS SDK fires onApprove." },
            { error: "relation 'orders' does not exist", cause: "The migration hasn't been run.", fix: "Run the MIGRATION constant in Supabase SQL Editor." },
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
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Always verify the webhook signature before processing any event — never trust the payload alone.</li>
          <li>Deliver value (access, credits, downloads) only after <InlineCode>captureOrder()</InlineCode> succeeds server-side.</li>
          <li>Keep <InlineCode>PAYPAL_CLIENT_SECRET</InlineCode> server-side only. It allows full API access to your PayPal account.</li>
          <li>Use idempotency: check the <InlineCode>orders</InlineCode> table before delivering to prevent double-credit on webhook retries.</li>
        </ul>
      </Section>
    </div>
  )
}
