import React from "react"
import type { Metadata } from "next"
import { CodeBlock, EnvTable, InlineCode } from "@/components/docs/CodeBlock"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Team Workspace — Integration Guide — MarrowStack",
  description: "Integration walkthrough for the MarrowStack Team Workspace block: RBAC, invite flows, permission matrix, ORM-agnostic adapter.",
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

export default function TeamspaceDocsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Integration guide
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Team Workspace</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Multi-tenant workspaces: role hierarchy (owner/admin/member/viewer), invite flows
          with expiring tokens, a composable permission matrix, and an ORM-agnostic adapter
          pattern that works with Prisma, Drizzle, or raw Supabase.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">Read the Getting Access guide</Link> if you haven&apos;t yet.
        </p>
      </div>

      <Section title="1. Get the file">
        <p>
          Sign in at marrowstack.dev, open the{" "}
          <Link href="/blocks/team" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>Team Workspace block</Link>,
          and click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          Paste <InlineCode>lib/teamspace.ts</InlineCode> (~440 lines) into your project.
          The SQL migration is embedded in the file. Mount the exported functions in your own API routes.
        </p>
      </Section>

      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>Supabase project (uses the same profiles table as the Auth block, or any users table)</li>
          <li>Auth session already implemented (to identify the acting user)</li>
        </ul>
      </Section>

      <Section title="3. Install">
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>Copy <InlineCode>teamspace.ts</InlineCode> from the block detail page and paste it into <InlineCode>lib/teamspace.ts</InlineCode> in your project.</li>
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
          Run the <InlineCode>MIGRATION</InlineCode> constant from <InlineCode>teamspace.ts</InlineCode> in Supabase SQL Editor.
          Creates: <InlineCode>workspaces</InlineCode>, <InlineCode>members</InlineCode>,
          <InlineCode>invites</InlineCode> tables with RLS. Invite tokens expire after 48 hours (configurable in the file).
        </p>
      </Section>

      <Section title="6. Wire it in">
        <CodeBlock filename="app/api/workspace/invite/route.ts" code={`import { createInvite, acceptInvite } from '@/lib/teamspace'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/workspace/invite  — actor must be owner or admin
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })
  const { workspaceId, email, role } = await req.json()
  const invite = await createInvite({ workspaceId, actorId: session.user.id, email, role })
  return NextResponse.json(invite)
}

// PATCH /api/workspace/invite  — called with the invite token from the email link
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })
  const { token } = await req.json()
  await acceptInvite({ token, userId: session.user.id })
  return NextResponse.json({ ok: true })
}`} />
      </Section>

      <Section title="7. Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Create a workspace: <InlineCode>createWorkspace(&#123; name: &apos;test&apos;, ownerId: userId &#125;)</InlineCode>. Confirm a row appears in <InlineCode>workspaces</InlineCode>.</li>
          <li>Invite a user: <InlineCode>createInvite(&#123; workspaceId, actorId, email, role: &apos;member&apos; &#125;)</InlineCode>. Confirm an <InlineCode>invites</InlineCode> row and an invite email.</li>
          <li>Accept the invite with the token. Confirm the user appears in <InlineCode>members</InlineCode>.</li>
          <li>Check a permission: <InlineCode>can(memberId, workspaceId, &apos;invite_member&apos;)</InlineCode> — must return <InlineCode>true</InlineCode> for admin/owner and <InlineCode>false</InlineCode> for viewer.</li>
        </ol>
      </Section>

      <Section title="8. Failure modes &amp; fixes">
        <div className="space-y-5">
          {[
            { error: "InviteExpiredError", cause: "The invite token is older than the configured TTL (48 hours by default).", fix: "Re-send the invite. The TTL is INVITE_TTL_HOURS at the top of teamspace.ts — adjust if needed." },
            { error: "PermissionDeniedError: insufficient role", cause: "The acting user's role does not have the required permission in the PERMISSION_MATRIX.", fix: "Check the acting user's role in the members table. Adjust the PERMISSION_MATRIX in teamspace.ts if your app needs different permissions." },
            { error: "WorkspaceNotFoundError", cause: "The workspace ID is wrong, or the workspace was deleted.", fix: "Verify the workspace ID. Confirm the workspaces row exists in Supabase." },
            { error: "relation 'members' does not exist", cause: "The migration has not been run.", fix: "Run the MIGRATION constant in Supabase SQL Editor." },
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
          <li>All permission checks go through the typed <InlineCode>can()</InlineCode> function — no ad-hoc role comparisons.</li>
          <li>Invite tokens are single-use, 48-hour TTL, cryptographically random.</li>
          <li>Role changes require <InlineCode>manage_members</InlineCode> permission (owner/admin only).</li>
          <li>RLS blocks client-side access to all workspace tables.</li>
        </ul>
        <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>What you must ensure:</strong></p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Call <InlineCode>can()</InlineCode> in every API route before performing privileged workspace operations.</li>
          <li>Verify the acting user is authenticated before any workspace API call.</li>
          <li>Deliver invite tokens over email only, never via URL query params visible in logs.</li>
        </ul>
      </Section>
    </div>
  )
}
