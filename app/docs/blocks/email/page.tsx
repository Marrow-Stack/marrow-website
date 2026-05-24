import React from "react"
import type { Metadata } from "next"
import { CodeBlock, EnvTable, InlineCode } from "@/components/docs/CodeBlock"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Email System — Integration Guide — MarrowStack",
  description: "Integration walkthrough for the MarrowStack Email System block: Resend transactional emails, branded HTML templates, welcome/verify/reset flows.",
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

export default function EmailDocsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Communication · Intermediate
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Email System</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Transactional email via Resend — welcome, verify, password reset, purchase receipt, refund,
          team invite, affiliate payout, and newsletter templates sharing one branded HTML layout.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">Read the Getting Access guide</Link> if you haven&apos;t yet.
        </p>
      </div>

      <Section title="1. Get the file">
        <p>
          Sign in at marrowstack.dev, open the{" "}
          <Link href="/blocks/email" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>Email System block</Link>,
          and click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          Paste <InlineCode>lib/email.ts</InlineCode> into your project. All templates share a single
          branded HTML layout — edit the <InlineCode>BRAND</InlineCode> constant at the top of the file
          to set your colors, logo URL, and company name.
        </p>
      </Section>

      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>Resend account at <InlineCode>resend.com</InlineCode> with a verified sender domain</li>
          <li>A domain with DNS access (to add the SPF/DKIM records Resend requires)</li>
        </ul>
      </Section>

      <Section title="3. Install">
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>Copy <InlineCode>lib/email.ts</InlineCode> from the block detail page into your project.</li>
          <li>Install peer dependencies:</li>
        </ol>
        <CodeBlock language="bash" code={`npm install resend zod`} />
      </Section>

      <Section title="4. Environment">
        <EnvTable rows={[
          { name: "RESEND_API_KEY", required: true, desc: "Resend API key from resend.com/api-keys" },
          { name: "EMAIL_FROM",     required: true, desc: "Verified sender address, e.g. hello@yourdomain.com" },
          { name: "APP_URL",        required: false, desc: "Base URL for action links in emails, e.g. https://yourdomain.com" },
        ]} />
      </Section>

      <Section title="5. Wire it in">
        <p>All functions are called server-side only. Import and call them from API routes, Server Actions, or route handlers.</p>
        <CodeBlock filename="app/api/auth/verify-email/route.ts" code={`import { sendVerifyEmail } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { email, verifyUrl } = await req.json()

  await sendVerifyEmail({
    to: email,
    verifyUrl,
  })

  return NextResponse.json({ ok: true })
}`} />

        <CodeBlock filename="Server Action — welcome email" code={`'use server'
import { sendWelcomeEmail } from '@/lib/email'

export async function onUserSignUp(email: string, name: string) {
  await sendWelcomeEmail({ to: email, name })
}`} />

        <p>Available send functions:</p>
        <ul className="list-disc list-inside space-y-1 pl-2 font-mono text-[12px]">
          <li>sendWelcomeEmail(&#123; to, name &#125;)</li>
          <li>sendVerifyEmail(&#123; to, verifyUrl &#125;)</li>
          <li>sendPasswordResetEmail(&#123; to, resetUrl &#125;)</li>
          <li>sendPurchaseReceiptEmail(&#123; to, orderDetails &#125;)</li>
          <li>sendRefundEmail(&#123; to, refundDetails &#125;)</li>
          <li>sendTeamInviteEmail(&#123; to, inviteUrl, workspaceName &#125;)</li>
          <li>sendNewsletterEmail(&#123; to, subject, content &#125;)</li>
        </ul>
      </Section>

      <Section title="6. Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Call <InlineCode>sendWelcomeEmail(&#123; to: 'your@email.com', name: 'Test' &#125;)</InlineCode> from a test route.</li>
          <li>Check Resend Dashboard → Logs to confirm the email was accepted and delivered.</li>
          <li>Open the email in a real inbox and verify the layout renders correctly across Gmail, Outlook, and Apple Mail.</li>
        </ol>
      </Section>

      <Section title="7. Failure modes &amp; fixes">
        <div className="space-y-5">
          {[
            { error: "API key is invalid", cause: "RESEND_API_KEY is wrong or expired.", fix: "Regenerate the API key in Resend Dashboard → API Keys." },
            { error: "From address is not verified", cause: "EMAIL_FROM uses a domain that hasn't been verified in Resend.", fix: "Add your domain in Resend Dashboard → Domains and add the required DNS records." },
            { error: "Emails delivered but landing in spam", cause: "SPF/DKIM records not set, or sending from a shared domain.", fix: "Verify a custom domain in Resend and ensure all DNS records are propagated. Avoid sending from resend.dev in production." },
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
