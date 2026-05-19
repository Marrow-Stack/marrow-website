"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { BLOCKS } from "@/lib/blocks-data";
import { BlockCard } from "@/components/blocks/BlockCard";

export function BlocksShowcase() {
  return (
    <section className="relative py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.2em] mb-4"
              style={{ color: "hsl(var(--accent-mineral))" }}
            >
              Available Now
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-reveal-light leading-tight">
              Ready-to-ship blocks
            </h2>
          </div>
          <Link
            href="/blocks"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium transition-all hover:gap-2.5"
            style={{ color: "hsl(var(--metal-shine))" }}
          >
            All blocks
            <ArrowRight size={14} />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BLOCKS.map((block, i) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.23, 1, 0.32, 1] }}
            >
              <BlockCard block={block} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex justify-center mt-10 sm:hidden"
        >
          <Link href="/blocks">
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all"
              style={{
                borderColor: "hsl(var(--metal-border))",
                color: "hsl(var(--metal-foreground))",
                background: "var(--metal-gradient)",
              }}
            >
              Browse all blocks
              <ArrowRight size={14} />
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
