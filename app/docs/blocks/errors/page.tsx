import type { Metadata } from "next"
import { CodeBlock, InlineCode, Section } from "@/components/docs/CodeBlock"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Error Handling — Integration Guide — MarrowStack",
  description: "Integration walkthrough for the MarrowStack Error Handling block: typed AppError, withApi() wrapper, React ErrorBoundary, and structured logging.",
}

export default function ErrorsDocsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Utility · Starter
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Error Handling</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Structured logging, typed custom errors, a React Error Boundary, and API route wrappers —
          gives every thrown error a consistent shape and HTTP status code so your app fails predictably.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">Read the Getting Access guide</Link> if you haven&apos;t yet.
        </p>
      </div>

      <Section title="1. Get the file">
        <p>
          Sign in at marrowstack.dev, open the{" "}
          <Link href="/blocks/errors" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>Error Handling block</Link>,
          and click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          Paste <InlineCode>lib/errors.ts</InlineCode> (and the React components) into your project.
          No runtime dependencies — the block uses only TypeScript and React built-ins.
        </p>
      </Section>

      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>TypeScript 5+ with strict mode</li>
          <li>React 18+ (for the Error Boundary component)</li>
        </ul>
      </Section>

      <Section title="3. Install">
        <p>No additional packages required. The block uses only Next.js and React built-ins.</p>
      </Section>

      <Section title="4. Wire it in">
        <p>
          Throw <InlineCode>AppError</InlineCode> anywhere in your server code — <InlineCode>withApi()</InlineCode>{" "}
          catches it and maps it to the correct HTTP status automatically:
        </p>
        <CodeBlock filename="app/api/items/[id]/route.ts" code={`import { withApi, AppError } from '@/lib/errors'
import { NextRequest } from 'next/server'

export const GET = withApi(async (req: NextRequest, { params }) => {
  const item = await db.items.findUnique({ where: { id: params.id } })

  if (!item) throw new AppError('Item not found', 'NOT_FOUND')
  if (!item.isPublic && !isOwner(item, req)) {
    throw new AppError('Forbidden', 'FORBIDDEN')
  }

  return Response.json(item)
})`} />

        <CodeBlock filename="Built-in error codes → HTTP status" code={`// AppError maps these codes to HTTP status codes automatically:
// 'NOT_FOUND'            → 404
// 'FORBIDDEN'            → 403
// 'UNAUTHORIZED'         → 401
// 'VALIDATION_ERROR'     → 422
// 'CONFLICT'             → 409
// 'TOO_MANY_REQUESTS'    → 429
// 'INTERNAL_ERROR'       → 500

throw new AppError('Email already in use', 'CONFLICT')
throw new AppError('Invalid input', 'VALIDATION_ERROR', { field: 'email' })
//                                                        ^ extra context, logged but not sent to client`} />

        <CodeBlock filename="React ErrorBoundary" code={`'use client'
import { ErrorBoundary, ErrorFallback } from '@/lib/errors'

// Wrap any subtree — unhandled render errors show ErrorFallback instead of crashing the page
export function ItemsSection() {
  return (
    <ErrorBoundary fallback={<ErrorFallback message="Could not load items." />}>
      <ItemsList />
    </ErrorBoundary>
  )
}`} />

        <CodeBlock filename="Structured logging" code={`import { safeLog } from '@/lib/errors'

// Logs to console in dev, structured JSON in production (works with Vercel Log Drains)
safeLog('info',  'Payment captured', { orderId, amount })
safeLog('warn',  'Webhook retry detected', { attempt: 3 })
safeLog('error', 'Supabase insert failed', { error, table: 'ms_users' })`} />
      </Section>

      <Section title="5. Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Throw <InlineCode>new AppError(&apos;Test&apos;, &apos;NOT_FOUND&apos;)</InlineCode> in a route wrapped with <InlineCode>withApi()</InlineCode> and confirm the response is <InlineCode>404</InlineCode> with a JSON body.</li>
          <li>Throw an unhandled <InlineCode>Error</InlineCode> (not an <InlineCode>AppError</InlineCode>) and confirm <InlineCode>withApi()</InlineCode> returns <InlineCode>500</InlineCode> without leaking the stack trace to the client.</li>
          <li>Wrap a component that throws during render with <InlineCode>ErrorBoundary</InlineCode> and confirm the fallback UI is shown.</li>
          <li>Call <InlineCode>safeLog(&apos;error&apos;, &apos;test&apos;, &#123; foo: 1 &#125;)</InlineCode> and confirm it appears in your terminal / Vercel logs.</li>
        </ol>
      </Section>

      <Section title="6. Failure modes &amp; fixes">
        <div className="space-y-5">
          {[
            { error: "withApi() returns 500 for all AppErrors", cause: "The error code is not one of the built-in codes, so it defaults to 500.", fix: "Use one of the defined codes: NOT_FOUND, FORBIDDEN, UNAUTHORIZED, VALIDATION_ERROR, CONFLICT, TOO_MANY_REQUESTS, INTERNAL_ERROR. Or add custom codes to the statusMap in errors.ts." },
            { error: "ErrorBoundary not catching errors", cause: "ErrorBoundary only catches errors during React rendering, not in async event handlers or setTimeout.", fix: "For async errors (e.g. fetch in a click handler), handle them with try/catch and set local error state. ErrorBoundary is for render-phase failures only." },
            { error: "safeLog output missing in Vercel logs", cause: "Log output is buffered and may not flush before the serverless function exits.", fix: "Ensure safeLog is called before returning from the handler. For critical logs, await the log write before responding." },
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
