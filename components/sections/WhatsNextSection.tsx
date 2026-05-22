"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const ITEMS = [
  {
    label: "Solana Auth",
    description:
      "Sign-In-With-Solana with server-side Ed25519 verification, sessions, and wallet↔email account linking.",
    href: "/blocks/solana-auth",
    badge: "Soon",
    accent: "hsl(160 60% 45%)",
  },
  {
    label: "Solana Payments",
    description:
      "USDC checkout on Solana — reference-keyed transfers, finalization checks, idempotent verification.",
    href: "/blocks/solana-payments",
    badge: "Soon",
    accent: "hsl(160 60% 45%)",
  },
  {
    label: "MarrowStack CLI",
    description:
      "One command per block: npx marrowstack add auth. Copy any block straight into your project.",
    href: "/cli",
    badge: "Coming next",
    accent: "hsl(263 70% 58%)",
  },
];

export function WhatsNextSection() {
  return (
    <section className="relative py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="mb-12"
        >
          <p
            className="text-xs font-bold uppercase tracking-[0.2em] mb-4"
            style={{ color: "hsl(var(--accent-mineral))" }}
          >
            What&apos;s next
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-reveal-light leading-tight">
            On the roadmap
          </h2>
          <p className="mt-2 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
            These are real things in development — not vaporware. Sign up to be notified when they ship.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ITEMS.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
            >
              <Link href={item.href} className="block group">
                <div
                  className="rounded-2xl border p-6 h-full transition-all hover:shadow-md"
                  style={{
                    background: "var(--metal-gradient)",
                    borderColor: "hsl(var(--metal-border))",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                      style={{
                        borderColor: `${item.accent} / 0.4`,
                        color: item.accent,
                      }}
                    >
                      {item.badge}
                    </span>
                    <ArrowRight
                      size={13}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "hsl(var(--metal-shine))" }}
                    />
                  </div>
                  <p
                    className="text-sm font-bold mb-2"
                    style={{ color: "hsl(var(--metal-foreground))" }}
                  >
                    {item.label}
                  </p>
                  <p className="text-[12px] leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
                    {item.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
