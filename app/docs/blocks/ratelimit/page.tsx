import type { Metadata } from "next"
import { CodeBlock, EnvTable, InlineCode, Section } from "@/components/docs/CodeBlock"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Rate Limiting — Integration Guide — MarrowStack",
  description: "Integration walkthrough for the MarrowStack Rate Limiting block: sliding-window rate limiting, per-IP and per-user strategies, Upstash Redis upgrade, standard headers.",
}

export default function RateLimitDocsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Utility · Starter
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Rate Limiting</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Sliding-window rate limiting for Next.js 14+ API routes — in-memory store for development,
          drop-in Upstash Redis upgrade for production, with per-IP and per-user strategies and
          standard <InlineCode>RateLimit-*</InlineCode> response headers.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">Read the Getting Access guide</Link> if you haven&apos;t yet.
        </p>
      </div>

      <Section title="1. Get the file">
        <p>
          Sign in at marrowstack.dev, open the{" "}
          <Link href="/blocks/ratelimit" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>Rate Limiting block</Link>,
          and click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          Paste <InlineCode>lib/ratelimit.ts</InlineCode> into your project.
        </p>
        <p>
          Out of the box the block uses an in-process memory store — no external dependencies required.
          When you&apos;re ready for production, swap in Upstash Redis by setting two environment variables
          (see section 4).
        </p>
      </Section>

      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>TypeScript 5+</li>
          <li>Upstash Redis account (optional — only for production Redis backend)</li>
        </ul>
      </Section>

      <Section title="3. Install">
        <p>No dependencies required for the in-memory mode. For Upstash Redis:</p>
        <CodeBlock language="bash" code={`npm install @upstash/redis`} />
      </Section>

      <Section title="4. Environment">
        <EnvTable rows={[
          { name: "UPSTASH_REDIS_REST_URL",   required: false, desc: "Upstash Redis REST URL. When set, Redis is used instead of in-memory store." },
          { name: "UPSTASH_REDIS_REST_TOKEN", required: false, desc: "Upstash Redis REST token. Required alongside UPSTASH_REDIS_REST_URL." },
        ]} />
        <p className="text-xs" style={{ color: "hsl(var(--metal-shine))" }}>
          When neither variable is set, the block falls back to an in-process sliding-window store.
          The in-memory store is not shared across serverless instances — use Redis in production.
        </p>
      </Section>

      <Section title="5. Wire it in">
        <p>Wrap any API route handler with <InlineCode>withRateLimit()</InlineCode>:</p>
        <CodeBlock filename="app/api/contact/route.ts" code={`import { withRateLimit } from '@/lib/ratelimit'
import { NextRequest, NextResponse } from 'next/server'

export const POST = withRateLimit(
  async (req: NextRequest) => {
    // your handler logic here
    return NextResponse.json({ ok: true })
  },
  {
    limit: 5,        // max requests
    window: 60,      // per 60 seconds
    strategy: 'ip',  // 'ip' | 'user' | 'global'
  }
)`} />

        <CodeBlock filename="Per-user rate limiting" code={`import { withRateLimit } from '@/lib/ratelimit'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const POST = withRateLimit(
  async (req) => {
    const session = await getServerSession(authOptions)
    // handler...
    return Response.json({ ok: true })
  },
  {
    limit: 20,
    window: 3600,       // 20 requests per hour
    strategy: 'user',   // uses session user ID as the key
    getUserId: async (req) => {
      const session = await getServerSession(authOptions)
      return session?.user?.id ?? null
    },
  }
)`} />

        <CodeBlock filename="Reading rate limit headers client-side" code={`const res = await fetch('/api/contact', { method: 'POST', body: JSON.stringify(data) })

// Standard rate limit headers are set on every response
const limit     = res.headers.get('RateLimit-Limit')     // e.g. "5"
const remaining = res.headers.get('RateLimit-Remaining') // e.g. "4"
const reset     = res.headers.get('RateLimit-Reset')     // Unix timestamp

if (res.status === 429) {
  const retryAfter = res.headers.get('Retry-After')
  console.log(\`Rate limited. Retry after \${retryAfter}s.\`)
}`} />
      </Section>

      <Section title="6. Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Set <InlineCode>limit: 2, window: 10</InlineCode> temporarily and call the route 3 times — confirm the third returns <InlineCode>429 Too Many Requests</InlineCode>.</li>
          <li>Inspect the response headers and confirm <InlineCode>RateLimit-Limit</InlineCode>, <InlineCode>RateLimit-Remaining</InlineCode>, and <InlineCode>Retry-After</InlineCode> are present.</li>
          <li>Wait for the window to expire and confirm requests succeed again.</li>
          <li>If using Upstash: open the Upstash console and confirm sliding-window keys appear under your database.</li>
        </ol>
      </Section>

      <Section title="7. Failure modes &amp; fixes">
        <div className="space-y-5">
          {[
            { error: "Rate limit not enforced — all requests pass", cause: "When using the in-memory store, each serverless function instance has its own counter. Two concurrent cold starts each start at 0.", fix: "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to use a shared Redis store. For local dev, in-memory is fine." },
            { error: "strategy: 'user' always falls back to IP", cause: "getUserId() returned null — session was not available or the user was not signed in.", fix: "Ensure the route is behind an auth check, or handle the null case explicitly to apply a stricter IP-based limit for unauthenticated users." },
            { error: "429 response has no Retry-After header", cause: "An older version of the block file is in use.", fix: "Re-copy lib/ratelimit.ts from the block detail page to get the latest version with standard headers." },
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
