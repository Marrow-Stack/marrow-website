import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { BLOCKS, getBlock, CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/blocks-data";
import { RefractiveDock } from "@/components/navbar";
import { Footer } from "@/components/Footer";
import { PlaygroundTabs } from "@/components/blocks/PlaygroundTabs";
import { AuthPreview } from "@/components/blocks/previews/AuthPreview";
import { AdminPreview } from "@/components/blocks/previews/AdminPreview";
import { TeamPreview } from "@/components/blocks/previews/TeamPreview";
import { SolanaAuthPreview } from "@/components/blocks/previews/SolanaAuthPreview";
import { SolanaPaymentsPreview } from "@/components/blocks/previews/SolanaPaymentsPreview";
import { BillingPreview } from "@/components/blocks/previews/BillingPreview";
import { PaymentsPreview } from "@/components/blocks/previews/PaymentsPreview";
import { EmailPreview } from "@/components/blocks/previews/EmailPreview";
import { ProfilePreview } from "@/components/blocks/previews/ProfilePreview";
import { NotificationsPreview } from "@/components/blocks/previews/NotificationsPreview";
import { SearchPreview } from "@/components/blocks/previews/SearchPreview";
import { FileUploadPreview } from "@/components/blocks/previews/FileUploadPreview";
import { AnalyticsPreview } from "@/components/blocks/previews/AnalyticsPreview";
import { SeoPreview } from "@/components/blocks/previews/SeoPreview";
import { I18nPreview } from "@/components/blocks/previews/I18nPreview";
import { RateLimitPreview } from "@/components/blocks/previews/RateLimitPreview";
import { ErrorHandlingPreview } from "@/components/blocks/previews/ErrorHandlingPreview";
import { DarkModePreview } from "@/components/blocks/previews/DarkModePreview";
import { FormValidationPreview } from "@/components/blocks/previews/FormValidationPreview";
import { PurchaseButton } from "@/components/blocks/PurchaseButton";
import { auth } from "@/lib/auth";
import { hasUserPurchasedBlock } from "@/lib/orders";
import type { MarrowBlock } from "@/lib/blocks-data";
import type { Metadata } from "next";

// Force dynamic so each request checks auth + purchase status
export const dynamic = "force-dynamic";

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
  return {
    title: `${block.name} — MarrowStack`,
    description: block.description,
    openGraph: {
      title: `${block.name} — MarrowStack`,
      description: block.description,
      url: `https://marrowstack.dev/blocks/${slug}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${block.name} — MarrowStack`,
      description: block.description,
    },
  };
}

// ── Preview component map ─────────────────────────────────────────────────────
function getPreviewComponent(slug: string): React.ComponentType {
  switch (slug) {
    // Core
    case "auth":             return AuthPreview;
    case "admin":            return AdminPreview;
    case "teamspace":        return TeamPreview;
    // Monetization
    case "billing":          return BillingPreview;
    case "payments":         return PaymentsPreview;
    // Utility
    case "email":            return EmailPreview;
    case "profile":          return ProfilePreview;
    case "notifications":    return NotificationsPreview;
    case "search":           return SearchPreview;
    case "fileupload":       return FileUploadPreview;
    case "analytics":        return AnalyticsPreview;
    case "seo":              return SeoPreview;
    case "i18n":             return I18nPreview;
    // Security
    case "ratelimit":        return RateLimitPreview;
    case "errorhandling":    return ErrorHandlingPreview;
    // UI
    case "darkmode":         return DarkModePreview;
    case "formvalidation":   return FormValidationPreview;
    // Solana
    case "solana-auth":      return SolanaAuthPreview;
    case "solana-payments":  return SolanaPaymentsPreview;
    default:                 return AuthPreview;
  }
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

  const session = await auth();
  let hasPurchased = false;
  let repoUrl: string | null = null;
  if (session?.user?.id) {
    hasPurchased = await hasUserPurchasedBlock(session.user.id, block.id);
    if (hasPurchased) {
      const repoKey = `GITHUB_REPO_${block.id.toUpperCase().replace(/-/g, "_")}`;
      const repo = process.env[repoKey];
      if (repo) repoUrl = `https://github.com/${repo}`;
    }
  }

  const PreviewComponent = getPreviewComponent(slug);
  const categoryStyle = CATEGORY_COLORS[block.category];

  return (
    <div className="min-h-screen font-display">
      <RefractiveDock />

      <main className="container mx-auto max-w-6xl px-4 pt-36 pb-24">
        {/* Back link */}
        <Link
          href="/blocks"
          className="inline-flex items-center gap-1.5 text-xs mb-10 transition-opacity hover:opacity-70"
          style={{ color: "hsl(var(--metal-shine))" }}
        >
          <ArrowLeft size={12} />
          All blocks
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
          {/* LEFT — Playground */}
          <div className="min-w-0">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border uppercase tracking-wider ${categoryStyle}`}>
                  {CATEGORY_LABELS[block.category]}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-reveal-light mb-2 leading-tight">
                {block.name}
              </h1>
              <p className="text-base leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
                {block.description}
              </p>
            </div>

            <PlaygroundTabs block={block} PreviewComponent={PreviewComponent} hasPurchased={hasPurchased} repoUrl={repoUrl} />
          </div>

          {/* RIGHT — Purchase panel */}
          <div className="lg:sticky lg:top-32 self-start space-y-4">
            {/* Price card */}
            <div
              className="rounded-2xl border p-6"
              style={{
                background: "var(--metal-gradient)",
                borderColor: "hsl(var(--metal-border))",
              }}
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-3xl font-black" style={{ color: "hsl(var(--metal-foreground))" }}>
                  ${block.price}
                </span>
                <span className="text-xs" style={{ color: "hsl(var(--metal-shine))" }}>
                  one-time
                </span>
              </div>
              <p className="text-xs mb-6" style={{ color: "hsl(var(--accent-mineral))" }}>
                Lifetime access · {block.linesOfCode} lines of TypeScript
              </p>

              <div className="mb-3">
                <PurchaseButton blockSlug={block.slug} blockPrice={block.price} hasPurchased={hasPurchased} repoUrl={repoUrl} />
              </div>

              <button
                className="w-full py-2.5 rounded-xl text-xs font-medium border transition-all active:translate-y-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-metal-shine focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                style={{
                  borderColor: "hsl(var(--metal-border))",
                  color: "hsl(var(--metal-foreground))",
                  background: "transparent",
                }}
              >
                View source preview
              </button>
            </div>

            {/* What's included */}
            <div
              className="rounded-2xl border p-5"
              style={{
                background: "var(--metal-gradient)",
                borderColor: "hsl(var(--metal-border))",
              }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "hsl(var(--metal-shine))" }}>
                What's included
              </p>
              <ul className="space-y-2.5">
                {block.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check
                      size={12}
                      className="mt-0.5 shrink-0"
                      style={{ color: "hsl(var(--metal-shine))" }}
                    />
                    <span className="text-[13px]" style={{ color: "hsl(var(--metal-foreground))" }}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
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
          </div>
        </div>

        {/* Other blocks */}
        <OtherBlocks current={block} />
      </main>

      <Footer />
    </div>
  );
}

function OtherBlocks({ current }: { current: MarrowBlock }) {
  const others = BLOCKS.filter((b) => b.id !== current.id);
  if (others.length === 0) return null;

  return (
    <div className="mt-20">
      <p
        className="text-xs font-bold uppercase tracking-widest mb-6"
        style={{ color: "hsl(var(--metal-shine))" }}
      >
        More blocks
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {others.map((b) => {
          const catStyle = CATEGORY_COLORS[b.category];
          return (
            <Link key={b.id} href={`/blocks/${b.slug}`}>
              <div
                className="group p-5 rounded-2xl border transition-all hover:shadow-md"
                style={{
                  background: "var(--metal-gradient)",
                  borderColor: "hsl(var(--metal-border))",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${catStyle}`}>
                    {CATEGORY_LABELS[b.category]}
                  </span>
                  <span className="text-sm font-bold" style={{ color: "hsl(var(--metal-foreground))" }}>
                    ${b.price}
                  </span>
                </div>
                <p className="text-sm font-bold mb-1 group-hover:opacity-80 transition-opacity" style={{ color: "hsl(var(--metal-foreground))" }}>
                  {b.name}
                </p>
                <p className="text-xs" style={{ color: "hsl(var(--accent-mineral))" }}>
                  {b.tagline}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
