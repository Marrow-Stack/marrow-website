import type { Metadata } from "next"
import { CodeBlock, InlineCode, Section } from "@/components/docs/CodeBlock"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Dark Mode — Integration Guide — MarrowStack",
  description: "Integration walkthrough for the MarrowStack Dark Mode block: flash-free dark mode with next-themes, Tailwind, three-way toggle, localStorage persistence, and OS preference sync.",
}

export default function DarkModeDocsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          UI · Starter
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">Dark Mode</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Flash-free dark mode for Next.js 14+ with Tailwind — three-way light/dark/system toggle,
          localStorage persistence, OS preference sync, and hydration-safe rendering via next-themes.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">Read the Getting Access guide</Link> if you haven&apos;t yet.
        </p>
      </div>

      <Section title="1. Get the file">
        <p>
          Sign in at marrowstack.dev, open the{" "}
          <Link href="/blocks/darkmode" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>Dark Mode block</Link>,
          and click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          Paste <InlineCode>lib/darkmode.ts</InlineCode> and the <InlineCode>ThemeToggle</InlineCode> component into your project.
        </p>
      </Section>

      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>Tailwind CSS with <InlineCode>darkMode: &apos;class&apos;</InlineCode> set in your config</li>
          <li>TypeScript 5+</li>
        </ul>
      </Section>

      <Section title="3. Install">
        <ol className="list-decimal list-inside space-y-2 pl-2">
          <li>Copy the block files into your project.</li>
          <li>Install peer dependencies:</li>
        </ol>
        <CodeBlock language="bash" code={`npm install next-themes`} />
      </Section>

      <Section title="4. Configure Tailwind">
        <p>
          Enable class-based dark mode in your Tailwind config — this is required for{" "}
          <InlineCode>dark:</InlineCode> variants to work:
        </p>
        <CodeBlock filename="tailwind.config.ts" code={`import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',   // ← required
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  // ...
}

export default config`} />
      </Section>

      <Section title="5. Wire it in">
        <p>
          Wrap your root layout with <InlineCode>ThemeProvider</InlineCode>. The{" "}
          <InlineCode>suppressHydrationWarning</InlineCode> on <InlineCode>&lt;html&gt;</InlineCode> prevents
          the React hydration mismatch that occurs when the theme is resolved client-side:
        </p>
        <CodeBlock filename="app/layout.tsx" code={`import { ThemeProvider } from '@/lib/darkmode'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}`} />

        <CodeBlock filename="ThemeToggle component" code={`'use client'
import { ThemeToggle } from '@/lib/darkmode'

// Drop anywhere in your nav — cycles through light → dark → system
export function Navbar() {
  return (
    <nav>
      <ThemeToggle />
    </nav>
  )
}`} />

        <CodeBlock filename="Using the theme hook" code={`'use client'
import { useTheme } from 'next-themes'

export function CustomToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  return (
    <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
      {resolvedTheme === 'dark' ? 'Switch to light' : 'Switch to dark'}
    </button>
  )
}`} />

        <p>
          Use Tailwind&apos;s <InlineCode>dark:</InlineCode> prefix to style any element conditionally:
        </p>
        <CodeBlock filename="Tailwind dark: usage" code={`<div className="bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
  <p className="text-sm dark:text-gray-400">Adapts to the active theme.</p>
</div>`} />
      </Section>

      <Section title="6. Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Click the <InlineCode>ThemeToggle</InlineCode> and confirm the page switches between light and dark without a flash.</li>
          <li>Refresh the page and confirm the theme persists (stored in <InlineCode>localStorage</InlineCode>).</li>
          <li>Set theme to <InlineCode>system</InlineCode> and toggle your OS dark mode preference — confirm the page follows.</li>
          <li>Open DevTools → Elements and confirm the <InlineCode>dark</InlineCode> class is added to and removed from <InlineCode>&lt;html&gt;</InlineCode>.</li>
        </ol>
      </Section>

      <Section title="7. Failure modes &amp; fixes">
        <div className="space-y-5">
          {[
            { error: "Flash of wrong theme on page load", cause: "suppressHydrationWarning is missing from the <html> tag, or ThemeProvider is not the outermost wrapper.", fix: "Add suppressHydrationWarning to <html lang=\"en\" suppressHydrationWarning>. Ensure ThemeProvider wraps all children in the root layout." },
            { error: "dark: Tailwind classes have no effect", cause: "darkMode is set to 'media' or not set in tailwind.config.ts.", fix: "Set darkMode: 'class' in tailwind.config.ts. The block uses the class strategy — 'media' ignores the ThemeProvider." },
            { error: "Theme resets to default on every page navigation", cause: "ThemeProvider is mounted inside a Client Component that remounts on navigation.", fix: "Move ThemeProvider to the root app/layout.tsx (Server Component), not inside any client layout or page component." },
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
