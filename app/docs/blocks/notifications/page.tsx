import React from "react"
import type { Metadata } from "next"
import { CodeBlock, EnvTable, InlineCode } from "@/components/docs/CodeBlock"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Notifications — Integration Guide — MarrowStack",
  description: "Integration walkthrough for the MarrowStack Notifications block: Supabase Realtime, Web Push, bell dropdown component, unread badge.",
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

export default function NotificationsDocsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Communication · Intermediate
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Notifications</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Real-time in-app notifications via Supabase Realtime — unread badge, mark-as-read, archive,
          bulk ops, Web Push subscribe/unsubscribe, and a bell dropdown component.
          Web Push (VAPID) is optional and can be enabled independently of in-app notifications.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">Read the Getting Access guide</Link> if you haven&apos;t yet.
        </p>
      </div>

      <Section title="1. Get the file">
        <p>
          Sign in at marrowstack.dev, open the{" "}
          <Link href="/blocks/notifications" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>Notifications block</Link>,
          and click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          Paste the files into your project. The block exports both server functions and a client hook/component.
        </p>
      </Section>

      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>Supabase project with Realtime enabled (enabled by default)</li>
          <li>For Web Push: generate VAPID keys with <InlineCode>npx web-push generate-vapid-keys</InlineCode></li>
        </ul>
      </Section>

      <Section title="3. Install">
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>Copy the block files from the block detail page into your project.</li>
          <li>Install peer dependencies:</li>
        </ol>
        <CodeBlock language="bash" code={`npm install @supabase/supabase-js zod web-push
npm install -D @types/web-push`} />
      </Section>

      <Section title="4. Environment">
        <EnvTable rows={[
          { name: "NEXT_PUBLIC_SUPABASE_URL",      required: true,  desc: "Your Supabase project URL" },
          { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true,  desc: "Anon key — used client-side for Realtime subscriptions" },
          { name: "SUPABASE_SERVICE_ROLE_KEY",     required: true,  desc: "Service role key — used server-side to create notifications" },
          { name: "VAPID_PUBLIC_KEY",              required: false, desc: "VAPID public key for Web Push. Generate: npx web-push generate-vapid-keys" },
          { name: "VAPID_PRIVATE_KEY",             required: false, desc: "VAPID private key — server-side only" },
          { name: "VAPID_EMAIL",                   required: false, desc: "Contact email for Web Push, e.g. mailto:admin@yourdomain.com" },
        ]} />
      </Section>

      <Section title="5. Database">
        <p>
          Run the <InlineCode>MIGRATION</InlineCode> constant in Supabase SQL Editor. Creates:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><InlineCode>notifications</InlineCode> — title, body, type, read_at, archived_at, user_id</li>
          <li><InlineCode>push_subscriptions</InlineCode> — Web Push endpoint and keys per user device</li>
        </ul>
        <p>
          Also enables Supabase Realtime on the <InlineCode>notifications</InlineCode> table so the client hook
          receives live updates without polling.
        </p>
      </Section>

      <Section title="6. Wire it in">
        <CodeBlock filename="app/api/notifications/route.ts" code={`import { createNotification, markAllRead } from '@/lib/notifications'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// POST — create a notification for a user
export async function POST(req: NextRequest) {
  const { userId, title, body, type } = await req.json()
  const n = await createNotification({ userId, title, body, type })
  return NextResponse.json(n)
}

// PATCH — mark all as read for the current user
export async function PATCH() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })
  await markAllRead(session.user.id)
  return NextResponse.json({ ok: true })
}`} />

        <CodeBlock filename="Client component — bell dropdown" code={`'use client'
import { NotificationBell } from '@/lib/notifications'
// Drop in anywhere in your layout — shows unread count and live updates
export function Header() {
  return (
    <header>
      <NotificationBell />
    </header>
  )
}`} />
      </Section>

      <Section title="7. Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Call <InlineCode>createNotification()</InlineCode> for a user and confirm the row appears in the <InlineCode>notifications</InlineCode> table.</li>
          <li>Open the app in the browser — the bell component should show an unread badge within 1 second via Realtime.</li>
          <li>Click a notification — confirm <InlineCode>read_at</InlineCode> is set in the database.</li>
          <li>(Optional) Subscribe to Web Push and confirm a row appears in <InlineCode>push_subscriptions</InlineCode>. Send a push via <InlineCode>sendPushNotification()</InlineCode> and confirm it arrives.</li>
        </ol>
      </Section>

      <Section title="8. Failure modes &amp; fixes">
        <div className="space-y-5">
          {[
            { error: "Realtime not working — no live updates", cause: "Realtime is not enabled for the notifications table, or the Supabase project is on a plan that limits Realtime connections.", fix: "In Supabase Dashboard → Database → Replication, enable the notifications table for Realtime. Check your plan's connection limit." },
            { error: "Web Push: invalid VAPID keys", cause: "VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY were not generated as a pair, or were rotated without updating subscriptions.", fix: "Generate a fresh pair with npx web-push generate-vapid-keys. Existing subscriptions will need to re-subscribe after a key change." },
            { error: "relation 'notifications' does not exist", cause: "The migration hasn't been run.", fix: "Run the MIGRATION constant in Supabase SQL Editor." },
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
