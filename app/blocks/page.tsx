"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { BLOCKS, CATEGORY_LABELS, type BlockCategory } from "@/lib/blocks-data";
import { BlockCard } from "@/components/blocks/BlockCard";
import { RefractiveDock } from "@/components/navbar";
import { Footer } from "@/components/Footer";

const ALL_CATEGORIES = ["all", "auth", "admin", "workspace", "solana"] as const;
type FilterCategory = "all" | BlockCategory;

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
            Production-ready server actions and backend logic, drop-shipped into your codebase.
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
              placeholder="Search blocks..."
              className="w-full h-10 pl-10 pr-4 rounded-xl text-sm outline-none transition-all focus:ring-1"
              style={{
                background: "var(--metal-gradient)",
                border: "1px solid hsl(var(--metal-border))",
                color: "hsl(var(--metal-foreground))",
                // @ts-ignore
                "--tw-ring-color": "hsl(var(--metal-shine))",
              }}
            />
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ borderColor: "hsl(var(--metal-border))", background: "var(--metal-gradient)" }}>
            <SlidersHorizontal size={12} className="ml-1.5 shrink-0" style={{ color: "hsl(var(--metal-shine))" }} />
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
                {cat === "all" ? "All" : CATEGORY_LABELS[cat as BlockCategory]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <p className="text-sm" style={{ color: "hsl(var(--metal-shine))" }}>
              No blocks match your search.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((block, i) => (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
              >
                <BlockCard block={block} />
              </motion.div>
            ))}
          </div>
        )}

        {/* More coming soon */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center py-12 rounded-2xl border border-dashed"
          style={{ borderColor: "hsl(var(--metal-border))" }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: "hsl(var(--metal-foreground))" }}>
            More blocks coming soon
          </p>
          <p className="text-xs" style={{ color: "hsl(var(--accent-mineral))" }}>
            Payments, notifications, file uploads, and more are in the pipeline.
          </p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
