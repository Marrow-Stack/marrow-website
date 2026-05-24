import React from "react"
import type { Metadata } from "next"
import { CodeBlock, EnvTable, InlineCode } from "@/components/docs/CodeBlock"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Admin Dashboard — Integration Guide — MarrowStack",
  description: "Integration walkthrough for the MarrowStack Admin Dashboard block: user management, revenue analytics, feature flags, audit log, CSV export.",
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

export default function AdminDocsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Integration guide
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Admin Dashboard</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Production admin backend: user management, revenue analytics, feature flags with rollout
          percentages, audit log, and CSV export. One file, Supabase-native.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">Read the Getting Access guide</Link> if you haven&apos;t yet.
        </p>
      </div>

      <Section title="1. Get the file">
        <p>
          Sign in at marrowstack.dev, open the{" "}
          <Link href="/blocks/admin" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>Admin Dashboard block</Link>,
          and click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          Paste <InlineCode>lib/admin.ts</InlineCode> (~510 lines) into your project.
          The SQL migration is embedded in the <InlineCode>MIGRATION</InlineCode> constant.
        </p>
        <p>
          This block is server-side only. It exports typed async functions (no React components).
          Call them from your API routes or Server Actions and build your own UI on top.
        </p>
      </Section>

      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>Supabase project with the Auth block already running (admin.ts reads the profiles table)</li>
          <li>An admin-role check in your auth layer (this block does not implement its own auth gate)</li>
        </ul>
      </Section>

      <Section title="3. Install">
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>Accept the GitHub invitation and clone the repo.</li>
          <li>Copy <InlineCode>admin.ts</InlineCode> into your project at <InlineCode>lib/admin.ts</InlineCode>.</li>
          <li>Install peer dependencies:</li>
        </ol>
        <CodeBlock language="bash" code={`npm install @supabase/supabase-js zod`} />
      </Section>

      <Section title="4. Environment">
        <EnvTable rows={[
          { name: "NEXT_PUBLIC_SUPABASE_URL",  required: true, desc: "Your Supabase project URL" },
          { name: "SUPABASE_SERVICE_ROLE_KEY", required: true, desc: "Service role key — server-side only" },
        ]} />
      </Section>

      <Section title="5. Database">
        <p>
          Run the <InlineCode>MIGRATION</InlineCode> constant from <InlineCode>admin.ts</InlineCode> in
          Supabase SQL Editor. Creates: <InlineCode>feature_flags</InlineCode>,{" "}
          <InlineCode>admin_audit_log</InlineCode>, and views over the profiles/orders tables.
          Requires the <InlineCode>profiles</InlineCode> table from the Auth block.
        </p>
      </Section>

      <Section title="6. Wire it in">
        <CodeBlock filename="app/api/admin/users/route.ts" code={`import { listUsers, banUser } from '@/lib/admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return new NextResponse('Forbidden', { status: 403 })
  const users = await listUsers({ page: 1, pageSize: 50 })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return new NextResponse('Forbidden', { status: 403 })
  const { userId } = await req.json()
  await banUser(userId, session.user.id)
  return NextResponse.json({ ok: true })
}`} />
      </Section>

      <Section title="7. Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Call <InlineCode>listUsers(&#123; page: 1, pageSize: 10 &#125;)</InlineCode> from a test route. Confirm it returns your user rows from Supabase.</li>
          <li>Create a feature flag via <InlineCode>createFeatureFlag(&#123; key: 'test', enabled: true, rolloutPct: 100 &#125;)</InlineCode> and confirm the row appears in <InlineCode>feature_flags</InlineCode>.</li>
          <li>Call <InlineCode>getRevenueSummary()</InlineCode> and confirm it returns aggregated data.</li>
          <li>Call <InlineCode>exportUsersCsv()</InlineCode> and confirm the returned string is valid CSV.</li>
        </ol>
      </Section>

      <Section title="8. Failure modes &amp; fixes">
        <div className="space-y-5">
          {[
            { error: "relation 'feature_flags' does not exist", cause: "The migration has not been run.", fix: "Run the MIGRATION constant SQL in Supabase SQL Editor." },
            { error: "row-level security policy violation", cause: "Using the anon key instead of the service role key.", fix: "Set SUPABASE_SERVICE_ROLE_KEY. The admin client must use this key." },
            { error: "column 'role' does not exist on profiles", cause: "The Auth block's profiles table is missing the role column, or the Auth migration has not been run.", fix: "Run the Auth block's MIGRATION first. Admin depends on it." },
            { error: "Cannot read properties of undefined (reading 'rows')", cause: "Supabase query returned null — table does not exist or RLS blocked it.", fix: "Check that the migration ran and that the service role key is correct." },
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
        <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>What this block handles:</strong></p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>All operations are audited to <InlineCode>admin_audit_log</InlineCode> with actor ID and timestamp.</li>
          <li>Ban/unban and role-change operations require an actor_id (must be an admin user).</li>
          <li>All table access goes through the service role key — RLS blocks direct client access.</li>
        </ul>
        <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>What you must ensure:</strong></p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Verify the caller is an admin in every API route before calling any admin function. This block does not enforce auth — that is your layer.</li>
          <li>The admin API routes must never be publicly accessible without an auth gate.</li>
          <li>Keep SUPABASE_SERVICE_ROLE_KEY server-side only. Exposing it client-side gives full database access to anyone.</li>
        </ul>
      </Section>
    </div>
  )
}
