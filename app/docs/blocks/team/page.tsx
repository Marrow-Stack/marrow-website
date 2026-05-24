import React from "react"
import type { Metadata } from "next"
import { CodeBlock, EnvTable, InlineCode } from "@/components/docs/CodeBlock"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Team Workspaces — Integration Guide — MarrowStack",
  description: "Integration walkthrough for the MarrowStack Team Workspaces block: RBAC, member invitations, role management, Supabase RLS.",
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

export default function TeamDocsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Auth &amp; Users · Advanced
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Team Workspaces</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Multi-tenant workspace management with RBAC (owner / admin / member / viewer), member invitations,
          role management, and a full dashboard UI — backed by Supabase with row-level security.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">Read the Getting Access guide</Link> if you haven&apos;t yet.
        </p>
      </div>

      <Section title="1. Get the file">
        <p>
          Sign in at marrowstack.dev, open the{" "}
          <Link href="/blocks/team" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>Team Workspaces block</Link>,
          and click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          Paste the files into your project. Exports include server functions, React components, and a SQL migration.
        </p>
      </Section>

      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>Supabase project</li>
          <li>Resend account with a verified sender domain for invite emails</li>
          <li>Auth session already implemented (to identify the acting user)</li>
        </ul>
      </Section>

      <Section title="3. Install">
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>Copy the block files from the block detail page and paste them into your project.</li>
          <li>Install peer dependencies:</li>
        </ol>
        <CodeBlock language="bash" code={`npm install @supabase/supabase-js zod resend`} />
      </Section>

      <Section title="4. Environment">
        <EnvTable rows={[
          { name: "NEXT_PUBLIC_SUPABASE_URL",   required: true,  desc: "Your Supabase project URL" },
          { name: "SUPABASE_SERVICE_ROLE_KEY",  required: true,  desc: "Service role key — server-side only" },
          { name: "RESEND_API_KEY",             required: true,  desc: "Resend API key for sending invite emails" },
          { name: "EMAIL_FROM",                 required: true,  desc: "Verified sender address, e.g. team@yourdomain.com" },
          { name: "INVITE_TTL_HOURS",           required: false, desc: "Invite token expiry in hours. Defaults to 48" },
        ]} />
      </Section>

      <Section title="5. Database">
        <p>
          Run the <InlineCode>MIGRATION</InlineCode> constant in Supabase SQL Editor. Creates:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><InlineCode>workspaces</InlineCode> — workspace name, slug, owner</li>
          <li><InlineCode>workspace_members</InlineCode> — user ↔ workspace with role column</li>
          <li><InlineCode>workspace_invites</InlineCode> — pending invites with expiring tokens</li>
        </ul>
        <p>RLS is enabled on all tables. Service role writes bypass RLS. Anon reads are blocked.</p>
      </Section>

      <Section title="6. Wire it in">
        <CodeBlock filename="app/api/workspace/invite/route.ts" code={`import { createInvite, acceptInvite } from '@/lib/team'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// POST — actor must be owner or admin
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  const { workspaceId, email, role } = await req.json()
  const invite = await createInvite({
    workspaceId,
    actorId: session.user.id,
    email,
    role,
  })
  return NextResponse.json(invite)
}

// PATCH — called with the invite token from the email link
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  const { token } = await req.json()
  const member = await acceptInvite({ token, userId: session.user.id })
  return NextResponse.json(member)
}`} />

        <CodeBlock filename="app/api/workspace/members/route.ts" code={`import { setMemberRole, removeMember, can } from '@/lib/team'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  const { workspaceId, memberId, role } = await req.json()
  // can() enforces that only owners/admins can change roles
  const allowed = await can(session.user.id, workspaceId, 'manage_roles')
  if (!allowed) return new NextResponse('Forbidden', { status: 403 })

  const updated = await setMemberRole({ workspaceId, memberId, role })
  return NextResponse.json(updated)
}`} />
      </Section>

      <Section title="7. Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Create a workspace and confirm a row appears in <InlineCode>workspaces</InlineCode> and the creator appears in <InlineCode>workspace_members</InlineCode> with role <InlineCode>owner</InlineCode>.</li>
          <li>Invite a user via <InlineCode>createInvite()</InlineCode>. Confirm an <InlineCode>invites</InlineCode> row and an invite email.</li>
          <li>Accept the invite with the token. Confirm the user appears in <InlineCode>workspace_members</InlineCode>.</li>
          <li>Check a permission: <InlineCode>can(memberId, workspaceId, &apos;invite_member&apos;)</InlineCode> — must return <InlineCode>true</InlineCode> for admin/owner and <InlineCode>false</InlineCode> for viewer.</li>
        </ol>
      </Section>

      <Section title="8. Failure modes &amp; fixes">
        <div className="space-y-5">
          {[
            { error: "InviteExpiredError", cause: "The invite token is older than the configured TTL (48 hours by default).", fix: "Re-send the invite. Adjust INVITE_TTL_HOURS if your flow needs longer." },
            { error: "InsufficientPermissionsError", cause: "The acting user does not have the required role for this operation.", fix: "Check role with can() before calling privileged functions." },
            { error: "Email delivery failed", cause: "RESEND_API_KEY is wrong, or the sender domain is not verified in Resend.", fix: "Verify your domain in Resend Dashboard → Domains." },
            { error: "relation 'workspaces' does not exist", cause: "The migration hasn't been run.", fix: "Run the MIGRATION constant in Supabase SQL Editor." },
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
          <li>Always call <InlineCode>can()</InlineCode> before any privileged operation — the block does not apply middleware-level protection.</li>
          <li>Deliver invite tokens over email only, never as visible URL query params in server logs.</li>
          <li>Keep <InlineCode>SUPABASE_SERVICE_ROLE_KEY</InlineCode> server-side only — it bypasses all RLS.</li>
        </ul>
      </Section>
    </div>
  )
}
