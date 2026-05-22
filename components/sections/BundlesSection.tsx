"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { BUNDLES, BLOCKS } from "@/lib/blocks/registry";

export function BundlesSection() {
  return (
    <section className="relative py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-14"
        >
          <p
            className="text-xs font-bold uppercase tracking-[0.2em] mb-4"
            style={{ color: "hsl(var(--accent-mineral))" }}
          >
            Curated Collections
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-reveal-light leading-tight">
            Start with a bundle
          </h2>
          <p className="mt-4 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
            Free, curated sets of blocks that work well together. Pick one and ship faster.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {BUNDLES.map((bundle, i) => {
            const included = bundle.blockSlugs
              .map((s) => BLOCKS.find((b) => b.slug === s))
              .filter(Boolean) as typeof BLOCKS;

            return (
              <motion.div
                key={bundle.slug}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                className="rounded-2xl border p-6 flex flex-col"
                style={{
                  background: "var(--metal-gradient)",
                  borderColor: "hsl(var(--metal-border))",
                }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: "hsl(var(--metal-shine))" }}
                >
                  {bundle.name}
                </p>
                <p className="text-sm mb-5 flex-1" style={{ color: "hsl(var(--accent-mineral))" }}>
                  {bundle.description}
                </p>

                <ul className="space-y-2 mb-5">
                  {included.map((b) => (
                    <li key={b.slug} className="flex items-center gap-2">
                      <Check
                        size={11}
                        className="shrink-0"
                        style={{ color: "hsl(var(--metal-shine))" }}
                      />
                      <Link
                        href={`/blocks/${b.slug}`}
                        className="text-[13px] hover:opacity-70 transition-opacity"
                        style={{ color: "hsl(var(--metal-foreground))" }}
                      >
                        {b.name}
                      </Link>
                    </li>
                  ))}
                </ul>

                <a
                  href={`https://github.com/${bundle.repo.owner}/${bundle.repo.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs transition-opacity hover:opacity-70"
                  style={{ color: "hsl(var(--metal-shine))" }}
                >
                  View bundle on GitHub →
                </a>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
