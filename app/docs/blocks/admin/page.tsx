import React from "react";
import type { Metadata } from "next";
import { CodeBlock, EnvTable } from "@/components/docs/CodeBlock";

export const metadata: Metadata = {
  title: "Admin Dashboard — MarrowStack Docs",
  description: "User management, revenue analytics, feature flags with rollout percentages, and CSV export for Next.js + Supabase.",
};

export default function AdminDocsPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Web2
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Admin Dashboard</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          User management, revenue analytics, feature flags with rollout percentages, activity log, and CSV export.
          All functions are server-only — no client bundle bloat.
        </p>
      </div>

      <Section title="What you get">
        <ul className="list-disc list-inside space-y-1.5 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <li><code className="font-mono text-[11px]">getDashboardStats()</code> — user counts, MRR (from your payments table), day-30 growth.</li>
          <li><code className="font-mono text-[11px]">listUsers(opts)</code> — paginated, filterable user list with sort and role filter.</li>
          <li><code className="font-mono text-[11px]">updateUserRole(userId, role)</code> — promote/demote users server-side.</li>
          <li><code className="font-mono text-[11px]">suspendUser(userId)</code> / <code className="font-mono text-[11px]">unsuspendUser(userId)</code> — soft-bans with audit trail.</li>
          <li><code className="font-mono text-[11px]">getFeatureFlags()</code> / <code className="font-mono text-[11px]">setFeatureFlag(key, config)</code> — flag management with percentage rollout.</li>
          <li><code className="font-mono text-[11px]">isFeatureEnabled(key, userId)</code> — deterministic, cheap user-level flag resolution (no external service).</li>
          <li><code className="font-mono text-[11px]">exportUsersCsv()</code> — returns a <code className="font-mono text-[11px]">Response</code> with <code className="font-mono text-[11px]">Content-Disposition: attachment</code> for direct browser download.</li>
          <li><code className="font-mono text-[11px]">requireAdmin(session)</code> — throws 403 if the session role is not <code className="font-mono text-[11px]">admin</code>.</li>
          <li>Three SQL tables: <code className="font-mono text-[11px]">feature_flags</code>, <code className="font-mono text-[11px]">admin_audit_log</code>, and a view over your existing <code className="font-mono text-[11px]">profiles</code> table.</li>
        </ul>
      </Section>

      <Section title="Install">
        <p className="text-sm mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Requires the Auth block's <code className="font-mono text-[11px]">profiles</code> table. No additional npm packages beyond the Auth block's dependencies.
        </p>
        <CodeBlock language="bash" code={`npm i @supabase/supabase-js next-auth`} />
      </Section>

      <Section title="Environment">
        <EnvTable rows={[
          { name: "NEXT_PUBLIC_SUPABASE_URL",  required: true,  desc: "Supabase project URL." },
          { name: "SUPABASE_SERVICE_ROLE_KEY", required: true,  desc: "Service role key. Never expose client-side." },
        ]} />
        <p className="text-xs mt-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Admin routes must be guarded by <code className="font-mono text-[11px]">requireAdmin(session)</code> — the block does not automatically restrict access by URL pattern.
        </p>
      </Section>

      <Section title="Usage">
        <CodeBlock language="typescript" code={`import {
  getDashboardStats,
  listUsers,
  updateUserRole,
  getFeatureFlags,
  setFeatureFlag,
  isFeatureEnabled,
  exportUsersCsv,
  requireAdmin,
} from '@/blocks/admin'
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/blocks/auth'

// Server component
export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  requireAdmin(session)

  const [stats, flags] = await Promise.all([
    getDashboardStats(),
    getFeatureFlags(),
  ])
  // ...
}

// Route handler — paginated users
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)

  const url = new URL(req.url)
  const users = await listUsers({
    page:   Number(url.searchParams.get('page')  ?? 1),
    limit:  Number(url.searchParams.get('limit') ?? 25),
    search: url.searchParams.get('q')  ?? undefined,
    role:   url.searchParams.get('role') ?? undefined,
  })
  return Response.json(users)
}`} />
      </Section>

      <Section title="Feature flags">
        <p className="text-sm mb-3" style={{ color: "hsl(var(--accent-mineral))" }}>
          Flags have a <code className="font-mono text-[11px]">rolloutPercentage</code> (0–100). <code className="font-mono text-[11px]">isFeatureEnabled(key, userId)</code> uses a deterministic hash of the userId so a given user's bucket doesn't change between calls. No external service required.
        </p>
        <CodeBlock language="typescript" code={`// Enable for 10% of users
await setFeatureFlag('new-editor', {
  enabled:           true,
  rolloutPercentage: 10,
  description:       'New rich-text editor beta',
})

// Check in a server component or route handler
const enabled = await isFeatureEnabled('new-editor', session.user.id)
if (enabled) { /* show new editor */ }`} />
      </Section>

      <Section title="CSV export">
        <CodeBlock language="typescript" filename="app/api/admin/export/route.ts" code={`import { exportUsersCsv, requireAdmin } from '@/blocks/admin'
import { getServerSession }              from 'next-auth'
import { authOptions }                   from '@/blocks/auth'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)
  return exportUsersCsv()   // returns Response with CSV attachment
}`} />
      </Section>

      <Section title="Troubleshooting">
        <div className="space-y-3 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <div>
            <p className="font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>getDashboardStats() returns 0 MRR</p>
            <p>MRR is computed from your <code className="font-mono text-[11px]">payments</code> table. If you're using a different table name, update the query constant at the top of the block file.</p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>requireAdmin throws 403 for an admin user</p>
            <p>The admin check reads the <code className="font-mono text-[11px]">role</code> field from the NextAuth session. Ensure the Auth block's <code className="font-mono text-[11px]">session</code> callback is returning the <code className="font-mono text-[11px]">role</code> field from your <code className="font-mono text-[11px]">profiles</code> table.</p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>Feature flag rollout is not deterministic</p>
            <p>The hash uses the userId string. If your user IDs change format between environments (e.g. UUID vs. integer), buckets will differ. Use consistent ID formats across environments.</p>
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
