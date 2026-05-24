import type { Metadata } from "next"
import { CodeBlock, EnvTable, InlineCode, Section } from "@/components/docs/CodeBlock"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Analytics Tracker — Integration Guide — MarrowStack",
  description: "Integration walkthrough for the MarrowStack Analytics block: PostHog, auto page-view hook, user identification, Supabase self-hosted fallback.",
}

export default function AnalyticsDocsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Utility · Intermediate
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Analytics Tracker</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          PostHog wrapper with auto page-view hook, user identification, a Supabase self-hosted fallback,
          and six pre-written SQL queries for DAU, WAU, funnel, revenue, and retention analysis.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">Read the Getting Access guide</Link> if you haven&apos;t yet.
        </p>
      </div>

      <Section title="1. Get the file">
        <p>
          Sign in at marrowstack.dev, open the{" "}
          <Link href="/blocks/analytics" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>Analytics Tracker block</Link>,
          and click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          Paste <InlineCode>lib/analytics.ts</InlineCode> into your project.
        </p>
      </Section>

      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>PostHog project at <InlineCode>app.posthog.com</InlineCode> (free tier available)</li>
          <li>Supabase project (optional — only needed for the self-hosted event fallback)</li>
        </ul>
      </Section>

      <Section title="3. Install">
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>Copy <InlineCode>lib/analytics.ts</InlineCode> from the block detail page into your project.</li>
          <li>Install peer dependencies:</li>
        </ol>
        <CodeBlock language="bash" code={`npm install posthog-js`} />
      </Section>

      <Section title="4. Environment">
        <EnvTable rows={[
          { name: "NEXT_PUBLIC_POSTHOG_KEY",   required: true,  desc: "PostHog project API key from Project Settings → API Keys" },
          { name: "NEXT_PUBLIC_POSTHOG_HOST",  required: false, desc: "PostHog instance URL. Defaults to https://app.posthog.com" },
          { name: "NEXT_PUBLIC_SUPABASE_URL",  required: false, desc: "Supabase URL — only needed for the self-hosted event fallback" },
          { name: "SUPABASE_SERVICE_ROLE_KEY", required: false, desc: "Service role key — only for self-hosted fallback" },
        ]} />
      </Section>

      <Section title="5. Wire it in">
        <CodeBlock filename="app/layout.tsx" code={`import { AnalyticsProvider } from '@/lib/analytics'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  )
}`} />

        <CodeBlock filename="Auto page-view tracking" code={`'use client'
import { usePageView } from '@/lib/analytics'

// Drop this in your root layout or a client wrapper
export function PageViewTracker() {
  usePageView() // tracks route changes automatically
  return null
}`} />

        <CodeBlock filename="Manual event tracking" code={`'use client'
import { useAnalytics } from '@/lib/analytics'

export function UpgradeButton() {
  const { track, identify } = useAnalytics()

  return (
    <button
      onClick={() => {
        track('upgrade_clicked', { plan: 'pro', source: 'navbar' })
      }}
    >
      Upgrade to Pro
    </button>
  )
}`} />
      </Section>

      <Section title="6. Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Open PostHog → Activity — navigate a few pages and confirm page view events appear within 30 seconds.</li>
          <li>Call <InlineCode>track('test_event', &#123; foo: 'bar' &#125;)</InlineCode> and confirm it appears in PostHog Live Events.</li>
          <li>Call <InlineCode>identify(userId, &#123; email &#125;)</InlineCode> after login and confirm the user profile is created in PostHog.</li>
        </ol>
      </Section>

      <Section title="7. Failure modes &amp; fixes">
        <div className="space-y-5">
          {[
            { error: "Events not appearing in PostHog", cause: "Ad blockers intercept PostHog requests in the browser.", fix: "Set up a PostHog reverse proxy at /ingest in your Next.js rewrites. Instructions are in the PostHog docs under Reverse Proxy." },
            { error: "NEXT_PUBLIC_POSTHOG_KEY is not defined", cause: "The env var is set without the NEXT_PUBLIC_ prefix, or not set at all.", fix: "Ensure the variable is prefixed with NEXT_PUBLIC_ so Next.js exposes it to the browser bundle." },
            { error: "Duplicate page view events", cause: "usePageView() is mounted in multiple components or at multiple levels of the component tree.", fix: "Mount usePageView() (or PageViewTracker) exactly once, in the root layout." },
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
