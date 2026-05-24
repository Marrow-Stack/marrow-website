"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import { BLOCKS, CATEGORY_LABELS } from "@/lib/blocks/registry";

const SHOWCASE_SLUGS = ["auth", "billing", "team", "email", "ratelimit", "darkmode"];

export function BlocksShowcaseSection() {
  const blocks = SHOWCASE_SLUGS.map((s) => BLOCKS.find((b) => b.slug === s)).filter(Boolean) as typeof BLOCKS;

  return (
    <section className="relative py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-wrap items-end gap-4 justify-between mb-12"
        >
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.2em] mb-4"
              style={{ color: "hsl(var(--accent-mineral))" }}
            >
              Available Now
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-reveal-light leading-tight">
              17 open-source blocks
            </h2>
            <p className="mt-2 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
              Free · MIT · Sign in to copy
            </p>
          </div>
          <Link
            href="/blocks"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium transition-all hover:gap-2.5"
            style={{ color: "hsl(var(--metal-shine))" }}
          >
            All 17 blocks
            <ArrowRight size={14} />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {blocks.map((block, i) => (
            <motion.div
              key={block.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
            >
              <Link href={`/blocks/${block.slug}`} className="block group">
                <div
                  className="rounded-2xl border p-5 h-full transition-all hover:shadow-md"
                  style={{
                    background: "var(--metal-gradient)",
                    borderColor: "hsl(var(--metal-border))",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                      style={{
                        borderColor: "hsl(var(--metal-border))",
                        color: "hsl(var(--metal-shine))",
                      }}
                    >
                      {CATEGORY_LABELS[block.category]}
                    </span>
                    <span
                      className="text-[10px] flex items-center gap-1"
                      style={{ color: "hsl(var(--metal-shine))" }}
                    >
                      <Clock size={9} />
                      ~{block.estimatedSetupMinutes}m
                    </span>
                  </div>
                  <p
                    className="text-sm font-bold mb-1 group-hover:opacity-80 transition-opacity"
                    style={{ color: "hsl(var(--metal-foreground))" }}
                  >
                    {block.name}
                  </p>
                  <p
                    className="text-[12px] line-clamp-2"
                    style={{ color: "hsl(var(--accent-mineral))" }}
                  >
                    {block.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex justify-center mt-8 sm:hidden"
        >
          <Link
            href="/blocks"
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "hsl(var(--metal-shine))" }}
          >
            Browse all 17 blocks
            <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
