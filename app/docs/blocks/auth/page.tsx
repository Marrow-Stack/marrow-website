import React from "react";
import type { Metadata } from "next";
import { CodeBlock, EnvTable } from "@/components/docs/CodeBlock";

export const metadata: Metadata = {
  title: "Auth System — MarrowStack Docs",
  description: "Email/password with bcrypt, GitHub/Google OAuth, email verification, brute-force lockout, and RBAC for Next.js + Supabase.",
};

export default function AuthDocsPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Web2
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Auth System</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Email/password with bcrypt, GitHub and Google OAuth, email verification, per-IP brute-force lockout,
          role-based access control, and a Supabase-backed session store.
        </p>
      </div>

      <Section title="What you get">
        <ul className="list-disc list-inside space-y-1.5 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <li>NextAuth v4 config with Credentials + GitHub + Google providers, ready to extend.</li>
          <li><code className="font-mono text-[11px]">registerUser()</code> — hashes password with bcrypt (rounds configurable), creates profile row, sends verification email.</li>
          <li><code className="font-mono text-[11px]">verifyEmail()</code> — validates token, marks account active, returns session.</li>
          <li><code className="font-mono text-[11px]">lockoutGuard()</code> — tracks failed attempts per IP in <code className="font-mono text-[11px]">auth_lockouts</code> table, blocks after configurable threshold.</li>
          <li><code className="font-mono text-[11px]">requireRole(session, role)</code> — throws 401/403 for guards in server components and route handlers.</li>
          <li>Three SQL tables: <code className="font-mono text-[11px]">profiles</code>, <code className="font-mono text-[11px]">email_verifications</code>, <code className="font-mono text-[11px]">auth_lockouts</code>, all with RLS.</li>
        </ul>
      </Section>

      <Section title="Install">
        <CodeBlock language="bash" code={`npm i next-auth bcryptjs @supabase/supabase-js nodemailer
npm i -D @types/bcryptjs`} />
      </Section>

      <Section title="Environment">
        <EnvTable rows={[
          { name: "NEXTAUTH_SECRET",           required: true,  desc: "Random secret for JWT signing. Generate with: openssl rand -base64 32" },
          { name: "NEXTAUTH_URL",              required: true,  desc: "Full base URL (e.g. https://app.example.com). Used for OAuth redirects." },
          { name: "GITHUB_CLIENT_ID",          required: false, desc: "GitHub OAuth app client ID. Omit to disable GitHub sign-in." },
          { name: "GITHUB_CLIENT_SECRET",      required: false, desc: "GitHub OAuth app client secret." },
          { name: "GOOGLE_CLIENT_ID",          required: false, desc: "Google OAuth client ID." },
          { name: "GOOGLE_CLIENT_SECRET",      required: false, desc: "Google OAuth client secret." },
          { name: "SMTP_HOST",                 required: false, desc: "SMTP server for verification emails. Omit to skip email verification." },
          { name: "SMTP_PORT",                 required: false, default: "587", desc: "SMTP port." },
          { name: "SMTP_USER",                 required: false, desc: "SMTP username." },
          { name: "SMTP_PASS",                 required: false, desc: "SMTP password." },
          { name: "EMAIL_FROM",                required: false, desc: "From address for verification emails." },
          { name: "NEXT_PUBLIC_SUPABASE_URL",  required: true,  desc: "Supabase project URL." },
          { name: "SUPABASE_SERVICE_ROLE_KEY", required: true,  desc: "Service role key. Never expose client-side." },
          { name: "BCRYPT_ROUNDS",             required: false, default: "12", desc: "bcrypt work factor. Don't go below 10." },
          { name: "MAX_LOGIN_ATTEMPTS",        required: false, default: "5",  desc: "Failed attempts before lockout." },
          { name: "LOCKOUT_WINDOW_MINUTES",    required: false, default: "15", desc: "Lockout window in minutes." },
        ]} />
      </Section>

      <Section title="Mount the route">
        <CodeBlock language="typescript" filename="app/api/auth/[...nextauth]/route.ts" code={`import { authOptions } from '@/blocks/auth'
import NextAuth from 'next-auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }`} />
      </Section>

      <Section title="Register + verify">
        <CodeBlock language="typescript" code={`// app/api/register/route.ts
import { registerUser } from '@/blocks/auth'

export async function POST(req: Request) {
  const { email, password, name } = await req.json()
  const result = await registerUser({ email, password, name })
  // result.userId — user created; verification email sent if SMTP configured
  return Response.json(result)
}

// app/api/verify-email/route.ts
import { verifyEmail } from '@/blocks/auth'

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token') ?? ''
  const session = await verifyEmail(token)
  return Response.redirect('/dashboard')
}`} />
      </Section>

      <Section title="Role guards">
        <CodeBlock language="typescript" code={`import { requireRole }    from '@/blocks/auth'
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/blocks/auth'

// In a server component or route handler:
const session = await getServerSession(authOptions)
requireRole(session, 'admin')   // throws 403 if role !== 'admin'
requireRole(session, 'member')  // throws 401 if not signed in`} />
      </Section>

      <Section title="Roles">
        <p className="text-sm mb-3" style={{ color: "hsl(var(--accent-mineral))" }}>
          The block ships with three roles: <code className="font-mono text-[11px]">admin</code>, <code className="font-mono text-[11px]">member</code>, and <code className="font-mono text-[11px]">viewer</code>.
          The <code className="font-mono text-[11px]">profiles</code> table has a <code className="font-mono text-[11px]">role</code> column (default: <code className="font-mono text-[11px]">member</code>).
          Assign admin by updating the row directly in Supabase or via the Admin block's user management panel.
        </p>
      </Section>

      <Section title="Troubleshooting">
        <div className="space-y-3 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
          <div>
            <p className="font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>JWT errors / session undefined</p>
            <p>Ensure <code className="font-mono text-[11px]">NEXTAUTH_SECRET</code> and <code className="font-mono text-[11px]">NEXTAUTH_URL</code> are set in production. A missing secret causes silent JWT failures.</p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>OAuth redirect_uri mismatch</p>
            <p>The callback URL NextAuth registers is <code className="font-mono text-[11px]">[NEXTAUTH_URL]/api/auth/callback/[provider]</code>. Add this exact URL to your OAuth app's allowed redirects.</p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>Lockout triggers on first failure</p>
            <p>Check <code className="font-mono text-[11px]">MAX_LOGIN_ATTEMPTS</code> — default is 5. The lockout table uses the request IP; ensure your reverse proxy forwards <code className="font-mono text-[11px]">X-Forwarded-For</code> correctly.</p>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>Verification email not sent</p>
            <p>If SMTP env vars are omitted, email verification is skipped and accounts are created active. Set the four <code className="font-mono text-[11px]">SMTP_*</code> vars to enable it.</p>
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
