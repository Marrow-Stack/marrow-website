import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, ExternalLink, FileCode } from "lucide-react";
import type { Metadata } from "next";

import { BLOCKS, getBlock, CATEGORY_LABELS } from "@/lib/blocks/registry";
import { listBlockFiles, buildCopyAllPayload, BlockNotAvailableError } from "@/lib/github/fetch";
import { RefractiveDock } from "@/components/navbar";
import { Footer } from "@/components/Footer";
import { FileViewer } from "@/components/blocks/viewer/FileViewer";
import { FeedbackVote } from "@/components/blocks/viewer/FeedbackVote";
import { BlockTeaserPage } from "@/components/blocks/BlockTeaserPage";
import { CliCopyButton } from "@/components/blocks/CliCopyButton";

export const dynamic = "force-static";
export const revalidate = 3600;

// ── Static paths ──────────────────────────────────────────────────────────────
export async function generateStaticParams() {
  return BLOCKS.map((b) => ({ slug: b.slug }));
}

// ── Per-block metadata ────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const block = getBlock(slug);
  if (!block) return {};
  const title = `${block.name} — MarrowStack`;
  const description = block.description.slice(0, 155);
  const ogUrl = `/api/og?title=${encodeURIComponent(block.name)}&description=${encodeURIComponent(block.description.slice(0, 80))}&category=${encodeURIComponent(block.category)}&status=${block.status}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://marrowstack.dev/blocks/${slug}`,
      type: "website",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function BlockDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const block = getBlock(slug);
  if (!block) notFound();

  // Teasers render a different component
  if (block.status === "teaser") {
    return <BlockTeaserPage block={block} />;
  }

  // Fetch source files from GitHub (cached 1hr; build-time prefetch)
  let source;
  try {
    source = await listBlockFiles(slug);
  } catch (err) {
    if (err instanceof BlockNotAvailableError) notFound();
    // Repo temporarily unavailable — render a graceful fallback
    return (
      <div className="min-h-screen font-display">
        <RefractiveDock />
        <main className="container mx-auto max-w-4xl px-4 pt-36 pb-24">
          <Link
            href="/blocks"
            className="inline-flex items-center gap-1.5 text-xs mb-10 hover:opacity-70"
            style={{ color: "hsl(var(--metal-shine))" }}
          >
            <ArrowLeft size={12} /> All blocks
          </Link>
          <h1 className="text-2xl font-black text-reveal-light mb-4">{block.name}</h1>
          <p style={{ color: "hsl(var(--metal-shine))" }}>
            This block&apos;s source repo is temporarily unavailable. The team has been notified.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  // Build copy-all payload with all file contents
  const fileContentMap = new Map<string, string>();
  if (source.readme) {
    fileContentMap.set(source.readme.path, source.readme.content);
  }
  const copyAllPayload = buildCopyAllPayload(source, fileContentMap);

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: block.name,
    description: block.description,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `https://marrowstack.dev/blocks/${block.slug}`,
    },
    license: "https://opensource.org/licenses/MIT",
    publisher: {
      "@type": "Organization",
      name: "MarrowStack",
      url: "https://marrowstack.dev",
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Blocks", item: "https://marrowstack.dev/blocks" },
      { "@type": "ListItem", position: 2, name: block.name, item: `https://marrowstack.dev/blocks/${block.slug}` },
    ],
  };

  return (
    <div className="min-h-screen font-display">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <RefractiveDock />

      <main className="container mx-auto max-w-5xl px-4 pt-36 pb-24">
        {/* Back */}
        <Link
          href="/blocks"
          className="inline-flex items-center gap-1.5 text-xs mb-10 transition-opacity hover:opacity-70"
          style={{ color: "hsl(var(--metal-shine))" }}
        >
          <ArrowLeft size={12} />
          All blocks
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border"
              style={{
                borderColor: "hsl(var(--metal-border))",
                color: "hsl(var(--metal-shine))",
              }}
            >
              {CATEGORY_LABELS[block.category]}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border"
              style={{
                borderColor: "hsl(160 60% 45% / 0.4)",
                color: "hsl(160 60% 45%)",
              }}
            >
              Free · MIT
            </span>
            <span
              className="text-[10px] px-2.5 py-1 rounded-full border"
              style={{
                borderColor: "hsl(var(--metal-border))",
                color: "hsl(var(--metal-shine))",
              }}
            >
              {block.difficulty}
            </span>
            <span
              className="text-[10px] flex items-center gap-1 px-2.5 py-1 rounded-full border"
              style={{
                borderColor: "hsl(var(--metal-border))",
                color: "hsl(var(--metal-shine))",
              }}
            >
              <Clock size={10} />
              ~{block.estimatedSetupMinutes} min setup
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-reveal-light mb-2 leading-tight">
            {block.name}
          </h1>
          <p className="text-base leading-relaxed mb-4" style={{ color: "hsl(var(--accent-mineral))" }}>
            {block.description}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {block.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono px-2.5 py-1 rounded-lg border"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderColor: "hsl(var(--metal-border))",
                  color: "hsl(var(--metal-shine))",
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href={`https://github.com/${source.repo.owner}/${source.repo.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
              style={{ color: "hsl(var(--metal-shine))" }}
            >
              Open on GitHub <ExternalLink size={11} />
            </a>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "hsl(var(--metal-shine))" }}>
              <FileCode size={11} />
              {source.files.length} files
            </span>
            <span className="text-xs font-mono" style={{ color: "hsl(var(--metal-shine))" }}>
              commit {source.ref.slice(0, 7)}
            </span>
          </div>
        </div>

        <p className="text-xs mb-8 italic" style={{ color: "hsl(var(--metal-shine))" }}>
          MIT licensed. Use it anywhere, no attribution required.
        </p>

        {/* File viewer */}
        <Suspense
          fallback={
            <div
              className="h-64 rounded-xl border flex items-center justify-center"
              style={{
                borderColor: "hsl(var(--metal-border))",
                color: "hsl(var(--metal-shine))",
              }}
            >
              Loading files…
            </div>
          }
        >
          <FileViewer
            source={source}
            copyAllPayload={copyAllPayload}
          />
        </Suspense>

        {/* CLI teaser pill */}
        <div
          className="mt-10 flex flex-wrap items-center gap-3 p-4 rounded-xl border"
          style={{
            background: "var(--metal-gradient)",
            borderColor: "hsl(var(--metal-border))",
          }}
        >
          <code
            className="text-xs font-mono px-3 py-1.5 rounded-lg"
            style={{
              background: "rgba(0,0,0,0.2)",
              color: "hsl(var(--metal-foreground))",
            }}
          >
            npx marrowstack add {block.slug}
          </code>
          <CliCopyButton slug={block.slug} />
          <span className="text-xs" style={{ color: "hsl(var(--metal-shine))" }}>
            CLI coming soon —{" "}
            <Link href="/cli" className="underline hover:opacity-70">
              get notified
            </Link>
          </span>
        </div>

        {/* Feedback */}
        <div
          className="mt-8 p-5 rounded-xl border"
          style={{
            background: "var(--metal-gradient)",
            borderColor: "hsl(var(--metal-border))",
          }}
        >
          <FeedbackVote slug={block.slug} />
        </div>

        {/* Edit on GitHub */}
        <div className="mt-6 text-center">
          <a
            href={`https://github.com/${source.repo.owner}/${source.repo.name}/edit/main/${source.repo.name === "ms-block-auth" ? "Readme.md" : "README.md"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs transition-opacity hover:opacity-70"
            style={{ color: "hsl(var(--metal-shine))" }}
          >
            Edit this page on GitHub →
          </a>
        </div>

        {/* Related blocks */}
        <RelatedBlocks current={slug} category={block.category} />
      </main>

      <Footer />
    </div>
  );
}

function RelatedBlocks({ current, category }: { current: string; category: string }) {
  const sameCategory = BLOCKS.filter(
    (b) => b.slug !== current && b.category === category && b.status === "available"
  );
  const different = BLOCKS.filter(
    (b) => b.slug !== current && b.category !== category && b.status === "available"
  );
  const others = [...sameCategory, ...different].slice(0, 4);
  if (others.length === 0) return null;

  return (
    <div className="mt-20">
      <p
        className="text-xs font-bold uppercase tracking-widest mb-6"
        style={{ color: "hsl(var(--metal-shine))" }}
      >
        Related blocks
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {others.map((b) => (
          <Link key={b.slug} href={`/blocks/${b.slug}`}>
            <div
              className="group p-5 rounded-2xl border transition-all hover:shadow-md"
              style={{
                background: "var(--metal-gradient)",
                borderColor: "hsl(var(--metal-border))",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                  style={{
                    borderColor: "hsl(var(--metal-border))",
                    color: "hsl(var(--metal-shine))",
                  }}
                >
                  {CATEGORY_LABELS[b.category]}
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: "hsl(var(--metal-shine))" }}
                >
                  Free · MIT
                </span>
              </div>
              <p
                className="text-sm font-bold mb-1 group-hover:opacity-80 transition-opacity"
                style={{ color: "hsl(var(--metal-foreground))" }}
              >
                {b.name}
              </p>
              <p className="text-xs line-clamp-2" style={{ color: "hsl(var(--accent-mineral))" }}>
                {b.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
