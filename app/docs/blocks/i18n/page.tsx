import React from "react"
import type { Metadata } from "next"
import { CodeBlock, EnvTable, InlineCode } from "@/components/docs/CodeBlock"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Internationalization — Integration Guide — MarrowStack",
  description: "Integration walkthrough for the MarrowStack i18n block: next-intl, locale routing, RTL support, currency and date formatting.",
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

export default function I18nDocsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Content · Intermediate
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Internationalization</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Locale routing, RTL support, and currency/date/number formatting for Next.js 14+ using next-intl 3.x.
          Ships with message files for English, French, German, Hindi, and Arabic.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">Read the Getting Access guide</Link> if you haven&apos;t yet.
        </p>
      </div>

      <Section title="1. Get the file">
        <p>
          Sign in at marrowstack.dev, open the{" "}
          <Link href="/blocks/i18n" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>Internationalization block</Link>,
          and click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          The block ships as a set of files: <InlineCode>lib/i18n.ts</InlineCode>, middleware config,
          and <InlineCode>messages/</InlineCode> JSON files for each locale.
        </p>
      </Section>

      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>TypeScript 5+ with strict mode</li>
        </ul>
      </Section>

      <Section title="3. Install">
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>Copy the block files into your project. Place message files in <InlineCode>messages/</InlineCode> at the project root.</li>
          <li>Install peer dependencies:</li>
        </ol>
        <CodeBlock language="bash" code={`npm install next-intl`} />
      </Section>

      <Section title="4. Environment">
        <EnvTable rows={[
          { name: "NEXT_PUBLIC_DEFAULT_LOCALE", required: false, desc: "Default locale. Defaults to en. Must be one of: en, fr, de, hi, ar" },
        ]} />
      </Section>

      <Section title="5. Wire it in">
        <CodeBlock filename="middleware.ts" code={`import createMiddleware from 'next-intl/middleware'
import { routing } from '@/lib/i18n'

export default createMiddleware(routing)

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}`} />

        <CodeBlock filename="app/[locale]/layout.tsx" code={`import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/lib/i18n'

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!routing.locales.includes(locale as never)) notFound()

  const messages = await getMessages()

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}`} />

        <CodeBlock filename="Usage in a page" code={`import { useTranslations } from 'next-intl'

export default function HomePage() {
  const t = useTranslations('home')
  return <h1>{t('title')}</h1>
}`} />
      </Section>

      <Section title="6. Adding a new locale">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Add the locale code to the <InlineCode>locales</InlineCode> array in <InlineCode>lib/i18n.ts</InlineCode>.</li>
          <li>Create <InlineCode>messages/&lt;locale&gt;.json</InlineCode> with translations for all keys present in <InlineCode>messages/en.json</InlineCode>.</li>
          <li>Set the <InlineCode>dir</InlineCode> attribute in your layout for RTL locales (Arabic, Hebrew, Urdu).</li>
        </ol>
      </Section>

      <Section title="7. Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Navigate to <InlineCode>/fr</InlineCode> and confirm the page renders in French.</li>
          <li>Navigate to <InlineCode>/ar</InlineCode> and confirm the layout direction is RTL.</li>
          <li>Call <InlineCode>formatCurrency(1234.5, 'USD', 'de')</InlineCode> and confirm the German currency format.</li>
        </ol>
      </Section>

      <Section title="8. Failure modes &amp; fixes">
        <div className="space-y-5">
          {[
            { error: "MISSING_MESSAGE: 'home.title'", cause: "A key exists in one locale's message file but is absent in another.", fix: "Keep all message files in sync. Add the missing key to the failing locale's JSON file." },
            { error: "locale param missing from URL", cause: "The app layout is at app/layout.tsx instead of app/[locale]/layout.tsx.", fix: "Move your root layout into app/[locale]/layout.tsx as shown in the wiring example." },
            { error: "Middleware not running", cause: "The matcher in middleware.ts is excluding the locale paths.", fix: "Use the matcher shown above — it excludes API routes, static files, and Next.js internals only." },
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
