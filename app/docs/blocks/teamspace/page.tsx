import React from "react";
import type { Metadata } from "next";
import { CodeBlock, EnvTable } from "@/components/docs/CodeBlock";

export const metadata: Metadata = {
  title: "Team Workspace — MarrowStack Docs",
  description: "Role hierarchy, invite flows, permission matrix, and ORM-agnostic adapter pattern for Next.js + Supabase.",
};

export default function TeamspaceDocsPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Web2
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Team Workspace</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Multi-tenant team management with a four-level role hierarchy, invite flows with token expiry,
          a composable permission matrix, and an ORM-agnostic adapter pattern so you can swap Supabase
          for Prisma, Drizzle, or Kysely without changing the block's API.
        </p>
      </div>

      <Section title="What you get">
        <ul className="list-disc list-inside space-y-1.5 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <li><code className="font-mono text-[11px]">createTeam(ownerId, name)</code> — creates team and makes the owner an <code className="font-mono text-[11px]">owner</code>-role member.</li>
          <li><code className="font-mono text-[11px]">inviteMember(teamId, email, role, invitedBy)</code> — generates an invite token, inserts into <code className="font-mono text-[11px]">team_invites</code>, returns the token for email delivery.</li>
          <li><code className="font-mono text-[11px]">acceptInvite(token, userId)</code> — validates token, checks expiry, promotes pending to active member.</li>
          <li><code className="font-mono text-[11px]">removeMember(teamId, userId, actorId)</code> — enforces role hierarchy (cannot remove someone of equal or higher role).</li>
          <li><code className="font-mono text-[11px]">changeRole(teamId, userId, newRole, actorId)</code> — role promotion/demotion with hierarchy guard.</li>
          <li><code className="font-mono text-[11px]">can(member, action)</code> — permission check against the action matrix. Returns boolean.</li>
          <li><code className="font-mono text-[11px]">requirePermission(member, action)</code> — throws 403 if <code className="font-mono text-[11px]">can()</code> returns false.</li>
          <li>Four SQL tables: <code className="font-mono text-[11px]">teams</code>, <code className="font-mono text-[11px]">team_members</code>, <code className="font-mono text-[11px]">team_invites</code>, <code className="font-mono text-[11px]">team_audit_log</code>, all with RLS.</li>
        </ul>
      </Section>

      <Section title="Role hierarchy">
        <div className="rounded-xl overflow-hidden border text-[12.5px]" style={{ borderColor: "hsl(var(--metal-border))" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--metal-gradient)", borderBottom: "1px solid hsl(var(--metal-border))" }}>
                {["Role", "Invite", "Remove members", "Manage billing", "Delete team"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--metal-shine))" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
              {[
                ["owner",  "✓", "✓ (all)", "✓", "✓"],
                ["admin",  "✓", "✓ (below admin)", "✓", "✗"],
                ["member", "✗", "✗", "✗", "✗"],
                ["viewer", "✗", "✗", "✗", "✗"],
              ].map(([role, ...cols], i) => (
                <tr key={role} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)", borderBottom: i < 3 ? "1px solid hsl(var(--metal-border))" : "none" }}>
                  <td className="px-4 py-2.5 font-mono font-semibold" style={{ color: "#79c0ff" }}>{role}</td>
                  {cols.map((c, j) => <td key={j} className="px-4 py-2.5">{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Install">
        <CodeBlock language="bash" code={`npm i @supabase/supabase-js next-auth`} />
      </Section>

      <Section title="Environment">
        <EnvTable rows={[
          { name: "NEXT_PUBLIC_SUPABASE_URL",  required: true,  desc: "Supabase project URL." },
          { name: "SUPABASE_SERVICE_ROLE_KEY", required: true,  desc: "Service role key. Never expose client-side." },
          { name: "INVITE_TOKEN_TTL_HOURS",    required: false, default: "72", desc: "How long invite tokens remain valid." },
        ]} />
      </Section>

      <Section title="Usage">
        <CodeBlock language="typescript" code={`import {
  createTeam,
  inviteMember,
  acceptInvite,
  removeMember,
  changeRole,
  can,
  requirePermission,
  getTeamMember,
} from '@/blocks/teamspace'

// Create a team
const team = await createTeam(session.user.id, 'Acme Corp')

// Invite someone
const { token } = await inviteMember(
  team.id,
  'alice@acme.com',
  'member',
  session.user.id,
)
// Send token via your email transport

// Accept invite (called from accept-invite API route)
await acceptInvite(token, newUser.id)

// Permission check
const actor = await getTeamMember(teamId, session.user.id)
requirePermission(actor, 'manage:billing')  // throws 403 if not allowed`} />
      </Section>

      <Section title="ORM adapter">
        <p className="text-sm mb-3" style={{ color: "hsl(var(--accent-mineral))" }}>
          The block's database calls go through an adapter interface. The default implementation uses the
          Supabase service role client. To swap it for Prisma or Drizzle, implement the <code className="font-mono text-[11px]">TeamAdapter</code> interface
          and pass it to <code className="font-mono text-[11px]">configureTeamspace(adapter)</code> at startup.
        </p>
        <CodeBlock language="typescript" code={`import { configureTeamspace } from '@/blocks/teamspace'
import { prisma }               from '@/lib/prisma'

configureTeamspace({
  async getTeam(id)         { return prisma.team.findUnique({ where: { id } }) },
  async createTeam(data)    { return prisma.team.create({ data }) },
  async getMember(tid, uid) { return prisma.teamMember.findUnique({ where: { teamId_userId: { teamId: tid, userId: uid } } }) },
  // ... implement remaining adapter methods
})`} />
      </Section>

      <Section title="Troubleshooting">
        <div className="space-y-3 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <div>
            <p className="font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>403 on removeMember for an admin</p>
            <p>Admins cannot remove other admins or owners. Promote the actor to <code className="font-mono text-[11px]">owner</code> first, or demote the target below <code className="font-mono text-[11px]">admin</code>.</p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>Invite token expired</p>
            <p><code className="font-mono text-[11px]">INVITE_TOKEN_TTL_HOURS</code> defaults to 72. Tokens past their <code className="font-mono text-[11px]">expires_at</code> return <code className="font-mono text-[11px]">INVITE_EXPIRED 410</code>. Re-invite the user to generate a fresh token.</p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>Duplicate team member error</p>
            <p>The <code className="font-mono text-[11px]">team_members</code> table has a unique constraint on <code className="font-mono text-[11px]">(team_id, user_id)</code>. Check for an existing membership before calling <code className="font-mono text-[11px]">acceptInvite</code>.</p>
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
