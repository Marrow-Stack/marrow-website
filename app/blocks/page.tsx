"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Clock, Copy, Check, Lock } from "lucide-react";
import Link from "next/link";
import { BLOCKS, CATEGORY_LABELS, type BlockCategory } from "@/lib/blocks/registry";
import { RefractiveDock } from "@/components/navbar";
import { Footer } from "@/components/Footer";

const ALL_CATEGORIES = ["all", "auth", "monetization", "communication", "content", "utility", "ui", "solana"] as const;
type FilterCategory = "all" | BlockCategory;

function CopyInstallButton({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "copied">("idle");

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    const cmd = `npx marrowstack add ${slug}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(cmd).catch(() => {});
    }
    setState("copied");
    setTimeout(() => setState("idle"), 2500);
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border transition-all hover:opacity-80"
      style={{
        borderColor: "hsl(var(--metal-border))",
        color: "hsl(var(--metal-shine))",
      }}
      title={`Copy: npx marrowstack add ${slug}`}
    >
      {state === "copied" ? <Check size={9} /> : <Copy size={9} />}
      {state === "copied" ? "Copied" : "CLI"}
    </button>
  );
}

function BlockCard({ block }: { block: (typeof BLOCKS)[number] }) {
  const isTeaser = block.status === "teaser";

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
      <Link href={`/blocks/${block.slug}`} className="block group">
        <div
          className="rounded-2xl border p-6 h-full transition-all duration-300"
          style={{
            background: "var(--metal-gradient)",
            borderColor: "hsl(var(--metal-border))",
            opacity: isTeaser ? 0.75 : 1,
          }}
        >
          {/* Top row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                style={{
                  borderColor: "hsl(var(--metal-border))",
                  color: "hsl(var(--metal-shine))",
                }}
              >
                {CATEGORY_LABELS[block.category]}
              </span>
              {isTeaser ? (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                  style={{
                    borderColor: "hsl(263 70% 58% / 0.4)",
                    color: "hsl(263 70% 58%)",
                  }}
                >
                  Coming soon
                </span>
              ) : (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full border"
                  style={{
                    borderColor: "hsl(160 60% 45% / 0.3)",
                    color: "hsl(160 60% 45%)",
                  }}
                >
                  Free · MIT
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px]" style={{ color: "hsl(var(--metal-shine))" }}>
              <Clock size={9} />
              {block.estimatedSetupMinutes}m
            </div>
          </div>

          {/* Title */}
          <h3
            className="text-base font-bold mb-1.5 group-hover:opacity-80 transition-opacity"
            style={{ color: "hsl(var(--metal-foreground))" }}
          >
            {block.name}
          </h3>
          <p
            className="text-[12px] leading-relaxed mb-4 line-clamp-2"
            style={{ color: "hsl(var(--accent-mineral))" }}
          >
            {block.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {block.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
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

          {/* Footer */}
          <div className="flex items-center justify-between">
            {!isTeaser ? (
              <CopyInstallButton slug={block.slug} />
            ) : (
              <span className="text-[10px] flex items-center gap-1" style={{ color: "hsl(263 70% 58%)" }}>
                <Lock size={9} />
                Not yet available
              </span>
            )}
            <span
              className="text-[11px] font-medium transition-all group-hover:opacity-60"
              style={{ color: "hsl(var(--metal-foreground))" }}
            >
              View →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function BlocksPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FilterCategory>("all");

  const filtered = useMemo(() => {
    return BLOCKS.filter((b) => {
      const matchesCategory = category === "all" || b.category === category;
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.tags.some((t) => t.includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  const available = filtered.filter((b) => b.status === "available");
  const teasers = filtered.filter((b) => b.status === "teaser");

  return (
    <div className="min-h-screen font-display">
      <RefractiveDock />

      <main className="container mx-auto max-w-5xl px-4 pt-40 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="mb-12"
        >
          <p
            className="text-xs font-bold uppercase tracking-[0.2em] mb-4"
            style={{ color: "hsl(var(--accent-mineral))" }}
          >
            Block Library
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-reveal-light leading-tight mb-4">
            All Blocks
          </h1>
          <p className="text-base max-w-xl" style={{ color: "hsl(var(--accent-mineral))" }}>
            17 open-source Next.js 14 modules. Free, MIT licensed. Sign in to copy any file into your project.
          </p>
        </motion.div>

        {/* Search + filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-col sm:flex-row gap-3 mb-10"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: "hsl(var(--metal-shine))" }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search blocks…"
              className="w-full h-10 pl-10 pr-4 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "var(--metal-gradient)",
                border: "1px solid hsl(var(--metal-border))",
                color: "hsl(var(--metal-foreground))",
              }}
            />
          </div>

          {/* Category filter */}
          <div
            className="flex flex-wrap items-center gap-1 p-1 rounded-xl border"
            style={{ borderColor: "hsl(var(--metal-border))", background: "var(--metal-gradient)" }}
          >
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat as FilterCategory)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                style={{
                  background: category === cat ? "hsl(var(--metal-border))" : "transparent",
                  color: category === cat ? "hsl(var(--metal-foreground))" : "hsl(var(--metal-shine))",
                }}
              >
                {cat === "all" ? "All" : cat === "solana" ? "Solana 🔜" : CATEGORY_LABELS[cat as BlockCategory]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Available blocks */}
        {available.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {available.map((block, i) => (
              <motion.div
                key={block.slug}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
              >
                <BlockCard block={block} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Teaser blocks */}
        {teasers.length > 0 && (
          <>
            <p
              className="text-xs font-bold uppercase tracking-widest mt-12 mb-4"
              style={{ color: "hsl(var(--metal-shine))" }}
            >
              Coming soon
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teasers.map((block, i) => (
                <motion.div
                  key={block.slug}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <BlockCard block={block} />
                </motion.div>
              ))}
            </div>
          </>
        )}

        {available.length === 0 && teasers.length === 0 && (
          <div className="text-center py-24">
            <p className="text-sm" style={{ color: "hsl(var(--metal-shine))" }}>
              No blocks match your search.
            </p>
          </div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-xs"
          style={{ color: "hsl(var(--metal-shine))" }}
        >
          {available.length} available · {teasers.length} coming soon · MIT · Free
        </motion.p>
      </main>

      <Footer />
    </div>
  );
}
