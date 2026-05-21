import React from "react"
import type { Metadata } from "next"
import { CodeBlock, EnvTable, InlineCode } from "@/components/docs/CodeBlock"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Auth System — Integration Guide — MarrowStack",
  description: "Post-purchase integration walkthrough for the MarrowStack Auth System block: NextAuth + Supabase, bcrypt, GitHub/Google OAuth, email verification, RBAC.",
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

export default function AuthDocsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Integration guide
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Auth System</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Full auth for Next.js App Router: email/password with bcrypt, GitHub and Google OAuth,
          email verification, brute-force lockout, JWT sessions, and role-based access control.
          One file. One Supabase migration.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">Read the universal post-purchase flow</Link> if you haven&apos;t yet.
        </p>
      </div>

      <Section title="1. What you received">
        <p>
          GitHub sent a collaborator invitation to{" "}
          <InlineCode>Marrow-Stack/marrow-website-v1.2</InlineCode>. Accept it from your
          GitHub notifications or email. If it has expired,{" "}
          <Link href="/dashboard" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>re-deliver from your dashboard</Link>.
        </p>
        <p>
          Once accepted, clone the repo and copy <InlineCode>lib/auth.ts</InlineCode> (~620 lines)
          into your own project. The SQL migration is embedded as the <InlineCode>MIGRATION</InlineCode> constant at the top of the file.
        </p>
        <p>
          Wallet-only buyers: your dashboard shows a &quot;Where should we deliver?&quot; prompt.
          Save your GitHub username there; delivery runs immediately.
        </p>
      </Section>

      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>Node 18+ or Bun</li>
          <li>A Supabase project (free tier is sufficient)</li>
          <li>GitHub OAuth App and/or Google OAuth credentials for social login</li>
          <li>An SMTP provider for email verification (Postmark, Resend, AWS SES)</li>
        </ul>
      </Section>

      <Section title="3. Install">
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>Accept the GitHub invitation and clone the repo.</li>
          <li>Copy <InlineCode>auth.ts</InlineCode> into your project at <InlineCode>lib/auth.ts</InlineCode>.</li>
          <li>Install peer dependencies:</li>
        </ol>
        <CodeBlock language="bash" code={`npm install next-auth @supabase/supabase-js bcryptjs nodemailer zod
npm install -D @types/bcryptjs @types/nodemailer`} />
      </Section>

      <Section title="4. Environment">
        <EnvTable rows={[
          { name: "NEXTAUTH_URL",              required: true,  desc: "Canonical URL of your app, e.g. https://example.com" },
          { name: "NEXTAUTH_SECRET",           required: true,  desc: "Random 32-byte base64 string. Generate: openssl rand -base64 32" },
          { name: "NEXT_PUBLIC_SUPABASE_URL",  required: true,  desc: "Your Supabase project URL (Settings → API)" },
          { name: "SUPABASE_SERVICE_ROLE_KEY", required: true,  desc: "Supabase service role key — server-side only" },
          { name: "GITHUB_CLIENT_ID",          required: false, desc: "GitHub OAuth App client ID. Omit to disable GitHub sign-in" },
          { name: "GITHUB_CLIENT_SECRET",      required: false, desc: "GitHub OAuth App client secret" },
          { name: "GOOGLE_CLIENT_ID",          required: false, desc: "Google OAuth client ID. Omit to disable Google sign-in" },
          { name: "GOOGLE_CLIENT_SECRET",      required: false, desc: "Google OAuth client secret" },
          { name: "SMTP_HOST",                 required: true,  desc: "SMTP server hostname for email verification" },
          { name: "SMTP_PORT",                 required: true,  default: "587", desc: "SMTP port (587 for TLS, 465 for SSL)" },
          { name: "SMTP_USER",                 required: true,  desc: "SMTP username or API token" },
          { name: "SMTP_PASS",                 required: true,  desc: "SMTP password or API token" },
          { name: "EMAIL_FROM",                required: true,  desc: "From address: noreply@yourdomain.com" },
        ]} />
      </Section>

      <Section title="5. Database">
        <p>
          The <InlineCode>MIGRATION</InlineCode> constant at the top of <InlineCode>auth.ts</InlineCode>{" "}
          contains all SQL. Run it in Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → run).
        </p>
        <p>
          Creates: <InlineCode>profiles</InlineCode>, <InlineCode>auth_tokens</InlineCode>, and{" "}
          <InlineCode>auth_events</InlineCode> tables with RLS enabled. The service role key bypasses RLS;
          client-side (anon) access is blocked on all three tables.
        </p>
      </Section>

      <Section title="6. Wire it in">
        <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>API route:</strong></p>
        <CodeBlock filename="app/api/auth/[...nextauth]/route.ts" code={`import { authOptions } from '@/lib/auth'
import NextAuth from 'next-auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }`} />
        <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Read session server-side:</strong></p>
        <CodeBlock filename="app/protected/page.tsx" code={`import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/api/auth/signin')
  return <div>Signed in as {session.user.email}</div>
}`} />
        <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Route protection via middleware:</strong></p>
        <CodeBlock filename="middleware.ts" code={`export { default } from 'next-auth/middleware'
export const config = { matcher: ['/dashboard/:path*'] }`} />
      </Section>

      <Section title="7. Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Navigate to <InlineCode>/api/auth/signin</InlineCode>. The sign-in page should render.</li>
          <li>Register with email and password. Confirm a verification email arrives.</li>
          <li>Click the verification link. Check <InlineCode>profiles.email_verified_at</InlineCode> is set in Supabase.</li>
          <li>Sign out and sign back in. Confirm <InlineCode>auth_events</InlineCode> has a new <InlineCode>sign_in</InlineCode> row.</li>
          <li>Fail login 5 times. Confirm <InlineCode>profiles.locked_until</InlineCode> is set and the error &quot;Account locked&quot; appears.</li>
        </ol>
      </Section>

      <Section title="8. Failure modes &amp; fixes">
        <div className="space-y-5">
          {[
            { error: "Error: NEXTAUTH_SECRET is not set", cause: "NextAuth requires a secret in all non-development environments.", fix: "Set NEXTAUTH_SECRET in .env.local. Generate: openssl rand -base64 32" },
            { error: "OAuthCallbackError: Invalid state", cause: "The OAuth callback URL in your GitHub/Google App settings does not match NEXTAUTH_URL.", fix: "Set callback URL to https://your-domain.com/api/auth/callback/github (or /google) in the OAuth app console." },
            { error: "Could not find service role key", cause: "The Supabase admin client is reading SUPABASE_SERVICE_ROLE_KEY, which is not set.", fix: "Add SUPABASE_SERVICE_ROLE_KEY (Supabase → Settings → API → service_role). Not the anon key." },
            { error: "Verification email not arriving", cause: "SMTP credentials incorrect, or sending domain lacks SPF/DKIM.", fix: "Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS against your provider's docs. Add SPF/DKIM records for your sending domain." },
            { error: "AuthorizationError: Account locked", cause: "5 consecutive failed login attempts trigger a 15-minute lockout.", fix: "Wait 15 minutes, or clear profiles.locked_until in Supabase SQL Editor for the affected row." },
            { error: "PostgreSQL RLS error on insert", cause: "Using the anon key instead of the service role key for a write operation.", fix: "Confirm SUPABASE_SERVICE_ROLE_KEY is set and that auth.ts uses it — not NEXT_PUBLIC_SUPABASE_ANON_KEY." },
          ].map(({ error, cause, fix }) => (
            <div key={error} className="space-y-1 pb-4 border-b last:border-b-0" style={{ borderColor: "hsl(var(--metal-border))" }}>
              <p className="font-mono text-[11px]" style={{ color: "#f85149" }}>{error}</p>
              <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Cause:</strong> {cause}</p>
              <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>Fix:</strong> {fix}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="9. Security responsibilities">
        <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>What this block handles:</strong></p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>bcrypt hashing at cost 12. Plaintext passwords are never stored.</li>
          <li>Email verification tokens: single-use, 24-hour TTL.</li>
          <li>Password reset tokens: single-use, 15-minute TTL.</li>
          <li>Brute-force lockout: 5 failures → 15-minute lock.</li>
          <li>Auth event logging: sign_in, sign_out, register, password_reset.</li>
          <li>JWT sessions (30-day TTL). No session state in the database.</li>
        </ul>
        <p><strong style={{ color: "hsl(var(--metal-foreground))" }}>What you must ensure:</strong></p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>HTTPS in production. Session cookies are not protected over plaintext HTTP.</li>
          <li>Keep NEXTAUTH_SECRET and SUPABASE_SERVICE_ROLE_KEY out of version control and client bundles.</li>
          <li>Set NEXTAUTH_URL to your exact production URL. OAuth callbacks fail if this is wrong.</li>
          <li>Rotate NEXTAUTH_SECRET if you believe it was leaked — this invalidates all active sessions.</li>
        </ul>
      </Section>
    </div>
  )
}
