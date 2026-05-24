import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getBlock, BLOCKS, type BlockEntry } from "@/lib/blocks/registry"
import { CodeBlock, EnvTable, InlineCode, Section } from "@/components/docs/CodeBlock"

export async function generateStaticParams() {
  return BLOCKS.map((b) => ({ slug: b.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const block = getBlock(slug)
  if (!block) return {}
  return {
    title: `${block.name} — Integration Guide — MarrowStack`,
    description: block.description,
  }
}

// ─── Per-block metadata ───────────────────────────────────────────────────────

interface BlockMeta {
  deps: string
  devDeps?: string
  envVars: { name: string; required: boolean; desc: string; default?: string }[]
  hasDb: boolean
  mainFile: string
  keyExports: string[]
  note?: string
}

const BLOCK_META: Record<string, BlockMeta> = {
  profile: {
    mainFile: "lib/profile.ts",
    deps: "npm install @supabase/supabase-js zod",
    hasDb: true,
    envVars: [
      { name: "NEXT_PUBLIC_SUPABASE_URL",   required: true,  desc: "Your Supabase project URL" },
      { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true, desc: "Supabase anon key — safe to expose client-side" },
      { name: "SUPABASE_SERVICE_ROLE_KEY",  required: true,  desc: "Service role key — server-side only" },
    ],
    keyExports: ["updateProfile()", "uploadAvatar()", "deleteAccount()", "getNotificationPreferences()"],
  },
  team: {
    mainFile: "lib/team.ts",
    deps: "npm install @supabase/supabase-js zod resend",
    hasDb: true,
    envVars: [
      { name: "NEXT_PUBLIC_SUPABASE_URL",   required: true,  desc: "Your Supabase project URL" },
      { name: "SUPABASE_SERVICE_ROLE_KEY",  required: true,  desc: "Service role key — server-side only" },
      { name: "RESEND_API_KEY",             required: true,  desc: "Resend API key for invite emails" },
      { name: "EMAIL_FROM",                 required: true,  desc: "Sender address, e.g. team@yourdomain.com" },
    ],
    keyExports: ["createWorkspace()", "inviteMember()", "acceptInvite()", "setMemberRole()", "can()"],
    note: "Invite emails are sent via Resend. Configure a verified domain in your Resend dashboard before going to production.",
  },
  billing: {
    mainFile: "lib/billing.ts",
    deps: "npm install @supabase/supabase-js zod",
    hasDb: true,
    envVars: [
      { name: "PAYPAL_CLIENT_ID",           required: true,  desc: "PayPal REST API client ID" },
      { name: "PAYPAL_CLIENT_SECRET",       required: true,  desc: "PayPal REST API client secret — server-side only" },
      { name: "PAYPAL_WEBHOOK_ID",          required: true,  desc: "Webhook ID from PayPal Developer Dashboard" },
      { name: "PAYPAL_MODE",                required: false, default: "sandbox", desc: "sandbox or live" },
      { name: "NEXT_PUBLIC_SUPABASE_URL",   required: true,  desc: "Your Supabase project URL" },
      { name: "SUPABASE_SERVICE_ROLE_KEY",  required: true,  desc: "Service role key — server-side only" },
    ],
    keyExports: ["createOrder()", "captureOrder()", "createSubscription()", "cancelSubscription()", "refundOrder()", "verifyWebhook()"],
    note: "Set PAYPAL_MODE=live and update your PayPal webhook URL before going to production.",
  },
  payments: {
    mainFile: "lib/payments.ts",
    deps: "npm install zod",
    hasDb: false,
    envVars: [
      { name: "PAYPAL_CLIENT_ID",           required: true,  desc: "PayPal REST API client ID" },
      { name: "PAYPAL_CLIENT_SECRET",       required: true,  desc: "PayPal REST API client secret — server-side only" },
      { name: "PAYPAL_WEBHOOK_ID",          required: true,  desc: "Webhook ID from PayPal Developer Dashboard" },
      { name: "PAYPAL_MODE",                required: false, default: "sandbox", desc: "sandbox or live" },
    ],
    keyExports: ["createOrder()", "captureOrder()", "refundCapture()", "verifyWebhookSignature()"],
    note: "This block maintains a module-level access token cache. Each cold-start fetches a fresh token from PayPal automatically.",
  },
  email: {
    mainFile: "lib/email.ts",
    deps: "npm install resend zod",
    hasDb: false,
    envVars: [
      { name: "RESEND_API_KEY",             required: true,  desc: "Resend API key" },
      { name: "EMAIL_FROM",                 required: true,  desc: "Verified sender address, e.g. hello@yourdomain.com" },
    ],
    keyExports: ["sendWelcomeEmail()", "sendVerifyEmail()", "sendPasswordResetEmail()", "sendPurchaseReceiptEmail()", "sendTeamInviteEmail()", "sendNewsletterEmail()"],
    note: "All templates share a single branded HTML layout. Edit the BRAND constant at the top of email.ts to set your colors and logo URL.",
  },
  notifications: {
    mainFile: "lib/notifications.ts",
    deps: "npm install @supabase/supabase-js zod",
    hasDb: true,
    envVars: [
      { name: "NEXT_PUBLIC_SUPABASE_URL",      required: true,  desc: "Your Supabase project URL" },
      { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true,  desc: "Supabase anon key — used client-side for Realtime" },
      { name: "SUPABASE_SERVICE_ROLE_KEY",     required: true,  desc: "Service role key — server-side only" },
      { name: "VAPID_PUBLIC_KEY",              required: false, desc: "Web Push VAPID public key. Generate with: npx web-push generate-vapid-keys" },
      { name: "VAPID_PRIVATE_KEY",             required: false, desc: "Web Push VAPID private key — server-side only" },
    ],
    keyExports: ["createNotification()", "markRead()", "markAllRead()", "archiveNotification()", "subscribeWebPush()", "useNotifications()"],
    note: "Web Push (VAPID) is optional. Omit VAPID keys to disable push — in-app Realtime notifications work without them.",
  },
  i18n: {
    mainFile: "lib/i18n.ts",
    deps: "npm install next-intl",
    hasDb: false,
    envVars: [
      { name: "NEXT_PUBLIC_DEFAULT_LOCALE", required: false, default: "en", desc: "Default locale for the app" },
    ],
    keyExports: ["useTranslations()", "getTranslations()", "routing", "locales", "formatCurrency()", "formatDate()"],
    note: "Ships with message files for en, fr, de, hi, ar. Add new locales by creating a messages/<locale>.json file.",
  },
  seo: {
    mainFile: "lib/seo.ts",
    deps: "npm install zod",
    hasDb: false,
    envVars: [
      { name: "NEXT_PUBLIC_APP_URL",        required: true,  desc: "Canonical URL of your app, e.g. https://example.com" },
    ],
    keyExports: ["buildMetadata()", "buildArticleJsonLd()", "buildProductJsonLd()", "buildBreadcrumbJsonLd()", "generateSitemap()", "robotsTxt"],
    note: "generateSitemap() is designed to be called from app/sitemap.ts. Pass your list of page paths and it returns the correct Sitemap format.",
  },
  forms: {
    mainFile: "lib/forms.ts",
    deps: "npm install react-hook-form zod @hookform/resolvers",
    hasDb: false,
    envVars: [],
    keyExports: ["useZodForm()", "useMultiStepForm()", "FormField", "FormError", "ContactForm", "LoginForm", "NewsletterForm"],
    note: "All three pre-built forms (ContactForm, LoginForm, NewsletterForm) perform server-side validation via a Server Action. Wire the action to your own handler.",
  },
  analytics: {
    mainFile: "lib/analytics.ts",
    deps: "npm install posthog-js @supabase/supabase-js",
    hasDb: false,
    envVars: [
      { name: "NEXT_PUBLIC_POSTHOG_KEY",    required: true,  desc: "PostHog project API key" },
      { name: "NEXT_PUBLIC_POSTHOG_HOST",   required: false, default: "https://app.posthog.com", desc: "PostHog instance URL. Change for self-hosted." },
      { name: "NEXT_PUBLIC_SUPABASE_URL",   required: false, desc: "Supabase fallback — only needed if using the self-hosted event store." },
      { name: "SUPABASE_SERVICE_ROLE_KEY",  required: false, desc: "Supabase service role key — only for self-hosted fallback." },
    ],
    keyExports: ["usePageView()", "useAnalytics()", "identify()", "track()", "AnalyticsProvider"],
    note: "The Supabase fallback logs events to a local events table if PostHog is unreachable. Six pre-written SQL queries for DAU/WAU/funnel are included as comments in the file.",
  },
  fileupload: {
    mainFile: "lib/fileupload.ts",
    deps: "npm install @supabase/supabase-js zod",
    hasDb: false,
    envVars: [
      { name: "NEXT_PUBLIC_SUPABASE_URL",      required: true,  desc: "Your Supabase project URL" },
      { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true,  desc: "Supabase anon key — used client-side for uploads" },
      { name: "SUPABASE_SERVICE_ROLE_KEY",     required: true,  desc: "Service role key — for generating signed URLs server-side" },
      { name: "UPLOAD_BUCKET",                 required: false, default: "uploads", desc: "Supabase Storage bucket name" },
      { name: "MAX_FILE_SIZE_MB",              required: false, default: "10",      desc: "Maximum allowed file size in megabytes" },
    ],
    keyExports: ["useFileUpload()", "FileUploadZone", "FileList", "getSignedUrl()", "deleteFile()"],
    note: "Create the storage bucket in Supabase Dashboard → Storage before first use. Set bucket visibility to private; signed URLs handle secure access.",
  },
  search: {
    mainFile: "lib/search.ts",
    deps: "npm install @supabase/supabase-js",
    hasDb: true,
    envVars: [
      { name: "NEXT_PUBLIC_SUPABASE_URL",      required: true,  desc: "Your Supabase project URL" },
      { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true,  desc: "Supabase anon key — used client-side for search queries" },
      { name: "SUPABASE_SERVICE_ROLE_KEY",     required: true,  desc: "Service role key — for indexing documents server-side" },
    ],
    keyExports: ["useSearch()", "indexDocument()", "deleteDocument()", "searchDocuments()", "getSearchFacets()"],
    note: "The migration creates a search_documents table with a tsvector column and a GIN index. Populate it by calling indexDocument() whenever your content changes.",
  },
  ratelimit: {
    mainFile: "lib/ratelimit.ts",
    deps: "npm install",
    hasDb: false,
    envVars: [
      { name: "UPSTASH_REDIS_REST_URL",     required: false, desc: "Upstash Redis REST URL. Omit to use the in-process fallback." },
      { name: "UPSTASH_REDIS_REST_TOKEN",   required: false, desc: "Upstash Redis REST token. Omit to use the in-process fallback." },
    ],
    keyExports: ["rateLimit()", "rateLimitMiddleware()", "getIp()"],
    note: "The in-process fallback resets on cold-start — fine for a single Vercel instance. For multi-region or high-traffic apps, set the Upstash env vars.",
  },
  errors: {
    mainFile: "lib/errors.ts",
    deps: "npm install zod",
    hasDb: false,
    envVars: [],
    keyExports: ["AppError", "NotFoundError", "ForbiddenError", "ValidationError", "withApi()", "ErrorBoundary", "safeLog"],
    note: "withApi() wraps any Next.js App Router route handler and returns a structured JSON error envelope on uncaught exceptions — raw stacks never reach the client.",
  },
  darkmode: {
    mainFile: "lib/darkmode.ts",
    deps: "npm install next-themes",
    hasDb: false,
    envVars: [],
    keyExports: ["ThemeProvider", "ThemeToggle", "useTheme()"],
    note: "Wrap your root layout with ThemeProvider. The toggle persists to localStorage and respects the OS preference on first load with no flash.",
  },
}

const CATEGORY_LABELS: Record<string, string> = {
  auth:           "Auth & Users",
  monetization:   "Monetization",
  communication:  "Communication",
  content:        "Content",
  utility:        "Utility",
  ui:             "UI",
  solana:         "Solana",
}

const DIFFICULTY_COLORS: Record<string, string> = {
  starter:      "hsl(var(--status-success))",
  intermediate: "hsl(var(--status-warning))",
  advanced:     "hsl(var(--status-error))",
}

// ─── Components ───────────────────────────────────────────────────────────────

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BlockDocPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const block = getBlock(slug)
  if (!block) notFound()

  const meta = BLOCK_META[slug]
  const categoryLabel = CATEGORY_LABELS[block.category] ?? block.category

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "hsl(var(--accent-mineral))" }}
          >
            {categoryLabel}
          </p>
          <span className="text-xs" style={{ color: "hsl(var(--metal-shine))" }}>·</span>
          <span
            className="text-xs font-semibold capitalize"
            style={{ color: DIFFICULTY_COLORS[block.difficulty] ?? "hsl(var(--accent-mineral))" }}
          >
            {block.difficulty}
          </span>
          <span className="text-xs" style={{ color: "hsl(var(--metal-shine))" }}>·</span>
          <span className="text-xs" style={{ color: "hsl(var(--metal-shine))" }}>
            ~{block.estimatedSetupMinutes} min setup
          </span>
        </div>
        <h1 className="text-3xl font-black text-reveal-light mb-3">{block.name}</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          {block.description}
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">
            Read the Getting Access guide
          </Link>{" "}
          if you haven&apos;t yet.
        </p>
      </div>

      {/* Tags */}
      {block.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {block.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2 py-0.5 rounded-full border font-mono"
              style={{
                borderColor: "hsl(var(--metal-border))",
                color: "hsl(var(--metal-shine))",
                background: "var(--metal-gradient)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 1. Get the file */}
      <Section title="1. Get the file">
        <p>
          Sign in at marrowstack.dev, open the{" "}
          <Link
            href={`/blocks/${block.slug}`}
            className="underline hover:opacity-80"
            style={{ color: "hsl(var(--metal-foreground))" }}
          >
            {block.name} block
          </Link>
          , and click{" "}
          <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          Paste {meta ? <InlineCode>{meta.mainFile}</InlineCode> : "the file(s)"} into your project.
        </p>
        {meta?.note && (
          <div
            className="p-3 rounded-xl text-xs"
            style={{
              background: "hsl(var(--status-info) / 0.08)",
              border: "1px solid hsl(var(--status-info) / 0.20)",
              color: "hsl(var(--accent-mineral))",
            }}
          >
            {meta.note}
          </div>
        )}
      </Section>

      {/* 2. Prerequisites */}
      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>Node.js 18+ or Bun 1.x</li>
          {block.tags.some((t) => t.includes("supabase")) && (
            <li>Supabase project (free tier is sufficient)</li>
          )}
          {block.tags.some((t) => t.includes("resend")) && (
            <li>Resend account with a verified sender domain</li>
          )}
          {block.tags.some((t) => t.includes("paypal")) && (
            <li>PayPal Developer account with a REST API app</li>
          )}
          {block.tags.some((t) => t.includes("posthog")) && (
            <li>PostHog project (cloud or self-hosted)</li>
          )}
          {block.tags.some((t) => t.includes("upstash")) && (
            <li>Upstash Redis database (optional — falls back to in-process)</li>
          )}
        </ul>
      </Section>

      {/* 3. Install */}
      {meta && (
        <Section title="3. Install">
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>
              Copy <InlineCode>{meta.mainFile}</InlineCode> from the block detail page and paste it into your project.
            </li>
            <li>Install peer dependencies:</li>
          </ol>
          <CodeBlock language="bash" code={meta.deps} />
          {meta.devDeps && (
            <CodeBlock language="bash" code={meta.devDeps} />
          )}
        </Section>
      )}

      {/* 4. Environment */}
      {meta && meta.envVars.length > 0 && (
        <Section title="4. Environment variables">
          <EnvTable rows={meta.envVars} />
        </Section>
      )}

      {/* 5. Database */}
      {meta?.hasDb && (
        <Section title={meta.envVars.length > 0 ? "5. Database" : "4. Database"}>
          <p>
            Run the <InlineCode>MIGRATION</InlineCode> constant embedded at the top of{" "}
            <InlineCode>{meta.mainFile}</InlineCode> in your Supabase SQL Editor (
            <strong style={{ color: "hsl(var(--metal-foreground))" }}>
              Dashboard → SQL Editor → New query → Run
            </strong>
            ). The migration uses <InlineCode>CREATE TABLE IF NOT EXISTS</InlineCode> — safe to re-run.
          </p>
        </Section>
      )}

      {/* Key exports */}
      {meta?.keyExports && meta.keyExports.length > 0 && (
        <Section title="Key exports">
          <ul className="space-y-1.5">
            {meta.keyExports.map((ex) => (
              <li key={ex} className="flex items-start gap-2">
                <span
                  className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: "hsl(var(--status-success))", marginTop: "6px" }}
                />
                <InlineCode>{ex}</InlineCode>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Verify */}
      <Section title="Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Start your dev server and open the browser console — confirm no import errors.</li>
          {block.tags.some((t) => t.includes("supabase")) && (
            <li>Open the Supabase Table Editor and confirm the migration tables are present.</li>
          )}
          <li>
            Call the first exported function with minimal arguments and confirm it returns without
            throwing. Check the Supabase logs or your terminal for any RLS errors.
          </li>
          <li>
            If the block includes a React component or hook, render it in a test page and confirm it
            mounts without errors.
          </li>
        </ol>
      </Section>

      {/* Links */}
      <div
        className="flex flex-wrap gap-3 pt-4 border-t"
        style={{ borderColor: "hsl(var(--metal-border))" }}
      >
        <Link
          href={`/blocks/${block.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium hover:opacity-80 transition-opacity"
          style={{ color: "hsl(var(--metal-foreground))" }}
        >
          View block & copy files
          <ArrowRight size={12} />
        </Link>
        <Link
          href="/docs/getting-started"
          className="inline-flex items-center gap-1.5 text-xs font-medium hover:opacity-80 transition-opacity"
          style={{ color: "hsl(var(--metal-shine))" }}
        >
          Getting started guide
          <ArrowRight size={12} />
        </Link>
        <Link
          href="/docs/security"
          className="inline-flex items-center gap-1.5 text-xs font-medium hover:opacity-80 transition-opacity"
          style={{ color: "hsl(var(--metal-shine))" }}
        >
          Security model
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}
