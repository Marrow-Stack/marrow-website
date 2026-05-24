import type { Metadata } from "next"
import { CodeBlock, EnvTable, InlineCode, Section } from "@/components/docs/CodeBlock"
import Link from "next/link"

export const metadata: Metadata = {
  title: "SEO Toolkit — Integration Guide — MarrowStack",
  description: "Integration walkthrough for the MarrowStack SEO Toolkit block: metadata, JSON-LD, sitemap, robots, OG images, hreflang.",
}

export default function SeoDocsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--accent-mineral))" }}>
          Content · Starter
        </p>
        <h1 className="text-3xl font-black text-reveal-light mb-3">SEO Toolkit</h1>
        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
          Metadata, JSON-LD schemas, sitemap, and robots helpers for Next.js 14+ — covers product pages,
          articles, breadcrumbs, OG images, Twitter Cards, hreflang, and noindex.
        </p>
        <p className="text-xs mt-3" style={{ color: "hsl(var(--metal-shine))" }}>
          <Link href="/docs/after-you-buy" className="underline hover:opacity-80">Read the Getting Access guide</Link> if you haven&apos;t yet.
        </p>
      </div>

      <Section title="1. Get the file">
        <p>
          Sign in at marrowstack.dev, open the{" "}
          <Link href="/blocks/seo" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }}>SEO Toolkit block</Link>,
          and click <strong style={{ color: "hsl(var(--metal-foreground))" }}>Copy all files</strong>.
          Paste <InlineCode>lib/seo.ts</InlineCode> into your project. No runtime dependencies beyond Next.js.
        </p>
      </Section>

      <Section title="2. Prerequisites">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Next.js 14 or 15, App Router</li>
          <li>TypeScript 5+</li>
        </ul>
      </Section>

      <Section title="3. Install">
        <p>No additional packages required. The block uses only Next.js built-ins.</p>
      </Section>

      <Section title="4. Environment">
        <EnvTable rows={[
          { name: "NEXT_PUBLIC_APP_URL", required: true, desc: "Canonical base URL of your site, e.g. https://yourdomain.com. Used in all absolute URLs." },
        ]} />
      </Section>

      <Section title="5. Wire it in">
        <CodeBlock filename="app/products/[slug]/page.tsx" code={`import { buildMetadata, buildProductJsonLd } from '@/lib/seo'
import type { Metadata } from 'next'

export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getProduct(params.slug)
  return buildMetadata({
    title: product.name,
    description: product.description,
    ogImage: product.imageUrl,
    canonical: \`/products/\${params.slug}\`,
  })
}

export default async function ProductPage({ params }) {
  const product = await getProduct(params.slug)
  const jsonLd = buildProductJsonLd({
    name: product.name,
    description: product.description,
    price: product.price,
    currency: 'USD',
    imageUrl: product.imageUrl,
    url: \`/products/\${params.slug}\`,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* page content */}
    </>
  )
}`} />

        <CodeBlock filename="app/sitemap.ts" code={`import { generateSitemap } from '@/lib/seo'
import { getAllProducts } from '@/lib/db'

export default async function sitemap() {
  const products = await getAllProducts()
  return generateSitemap([
    { url: '/', lastModified: new Date() },
    { url: '/products', lastModified: new Date() },
    ...products.map((p) => ({
      url: \`/products/\${p.slug}\`,
      lastModified: new Date(p.updatedAt),
    })),
  ])
}`} />

        <CodeBlock filename="app/robots.ts" code={`import { robotsTxt } from '@/lib/seo'
export default function robots() { return robotsTxt() }`} />
      </Section>

      <Section title="6. Verify it works">
        <ol className="list-decimal list-inside space-y-1.5 pl-2">
          <li>Visit <InlineCode>/sitemap.xml</InlineCode> and confirm it returns valid XML with your page URLs.</li>
          <li>Visit <InlineCode>/robots.txt</InlineCode> and confirm the sitemap URL is present.</li>
          <li>Open a product page and inspect the <InlineCode>&lt;head&gt;</InlineCode> — confirm OG tags and JSON-LD are present.</li>
          <li>Paste a page URL into the <a href="https://developers.google.com/search/docs/appearance/rich-results/rich-results-test" className="underline hover:opacity-80" style={{ color: "hsl(var(--metal-foreground))" }} target="_blank" rel="noopener noreferrer">Google Rich Results Test</a> and confirm it detects the schema.</li>
        </ol>
      </Section>

      <Section title="7. Failure modes &amp; fixes">
        <div className="space-y-5">
          {[
            { error: "Sitemap shows localhost URLs", cause: "NEXT_PUBLIC_APP_URL is set to http://localhost:3000.", fix: "Set NEXT_PUBLIC_APP_URL to your production domain on Vercel/your host. The sitemap uses this as the base URL." },
            { error: "OG image not rendering in social previews", cause: "The ogImage URL is relative. Social crawlers can't resolve relative URLs.", fix: "Pass absolute URLs to buildMetadata(). The block prepends NEXT_PUBLIC_APP_URL automatically when given a relative path." },
            { error: "JSON-LD not picked up by Google", cause: "The script tag is in the body instead of the head, or contains invalid JSON.", fix: "Place the script tag in the page component (not layout). Next.js App Router moves script tags to the head automatically." },
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
