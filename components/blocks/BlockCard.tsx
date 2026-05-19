"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileCode } from "lucide-react";
import type { MarrowBlock } from "@/lib/blocks-data";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/blocks-data";

interface BlockCardProps {
  block: MarrowBlock;
}

export function BlockCard({ block }: BlockCardProps) {
  const categoryStyle = CATEGORY_COLORS[block.category];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 500, damping: 20 }}
    >
      <Link href={`/blocks/${block.slug}`} className="block group">
        <div
          className="rounded-2xl border p-6 h-full transition-all duration-300"
          style={{
            background: "var(--metal-gradient)",
            borderColor: "hsl(var(--metal-border))",
          }}
        >
          {/* Top row */}
          <div className="flex items-start justify-between mb-4">
            <span
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border uppercase tracking-wider ${categoryStyle}`}
            >
              {CATEGORY_LABELS[block.category]}
            </span>
            <span className="text-sm font-bold" style={{ color: "hsl(var(--metal-foreground))" }}>
              ${block.price}
            </span>
          </div>

          {/* Title */}
          <h3
            className="text-base font-bold mb-1.5 group-hover:opacity-80 transition-opacity"
            style={{ color: "hsl(var(--metal-foreground))" }}
          >
            {block.name}
          </h3>
          <p className="text-[13px] leading-relaxed mb-5" style={{ color: "hsl(var(--accent-mineral))" }}>
            {block.tagline}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {block.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono px-2 py-0.5 rounded border"
                style={{
                  background: "rgba(255,255,255,0.03)",
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
            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "hsl(var(--metal-shine))" }}>
              <FileCode size={11} />
              <span>{block.linesOfCode} lines</span>
            </div>

            <div
              className="flex items-center gap-1 text-[11px] font-medium transition-all group-hover:gap-2"
              style={{ color: "hsl(var(--metal-foreground))" }}
            >
              View block
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
