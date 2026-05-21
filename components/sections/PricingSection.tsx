"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import { SPRING, TACTILE_PRESS_WHILETAP } from "@/components/marrow/motion";

const BUNDLES = [
  {
    name: "Growth Stack",
    price: "$79",
    description: "The essentials for a production SaaS: auth, billing, email, and a user profile.",
    blocks: ["Auth System", "Billing & Subscriptions", "Email System", "User Profile"],
    cta: "Get Growth Stack",
    href: "/blocks",
    highlight: false,
    accent: null,
  },
  {
    name: "Full SaaS MVP",
    price: "$149",
    description: "Every web2 block you need to launch a complete SaaS product.",
    blocks: [
      "Auth System", "Admin Dashboard", "Team Workspace",
      "Billing & Subscriptions", "Email System", "User Profile",
      "Notifications", "Rate Limiting", "Error Handling",
    ],
    cta: "Get Full SaaS MVP",
    href: "/blocks",
    highlight: true,
    accent: "hsl(263 70% 58%)",
  },
  {
    name: "Solana Launch Pack",
    price: "$129",
    description: "The only bundle that covers both web2 auth and Solana-native payments. No competitor sells this.",
    blocks: [
      "Solana Auth (SIWS)", "Solana Payments (USDC)",
      "Auth System", "Billing & Subscriptions", "Email System",
    ],
    cta: "Get Solana Pack",
    href: "/blocks",
    highlight: false,
    accent: "hsl(160 60% 45%)",
  },
];

export function PricingSection() {
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
            Bundles
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-reveal-light leading-tight">
            Buy once. Own it forever.
          </h2>
          <p className="mt-4 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
            Or buy individual blocks from $9. No subscriptions. No seat limits. No lock-in.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BUNDLES.map((bundle, i) => (
            <motion.div
              key={bundle.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
              className="relative rounded-2xl border p-6 flex flex-col"
              style={{
                background: bundle.highlight
                  ? `linear-gradient(145deg, hsl(263 70% 58% / 0.12) 0%, hsl(var(--background) / 0.95) 100%)`
                  : "var(--metal-gradient)",
                borderColor: bundle.highlight
                  ? "hsl(263 70% 58% / 0.4)"
                  : bundle.accent
                  ? `${bundle.accent} / 0.3`
                  : "hsl(var(--metal-border))",
              }}
            >
              {bundle.highlight && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: "hsl(263 70% 58%)", color: "hsl(0 0% 100%)" }}
                >
                  <Zap size={9} />
                  Most Complete
                </div>
              )}

              <div className="mb-5">
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: bundle.accent ?? "hsl(var(--accent-mineral))" }}
                >
                  {bundle.name}
                </p>
                <p
                  className="text-3xl font-black mb-2"
                  style={{ color: "hsl(var(--metal-foreground))" }}
                >
                  {bundle.price}
                </p>
                <p className="text-[13px]" style={{ color: "hsl(var(--accent-mineral))" }}>
                  {bundle.description}
                </p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {bundle.blocks.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <Check
                      size={12}
                      className="mt-0.5 shrink-0"
                      style={{ color: bundle.accent ?? "hsl(var(--metal-shine))" }}
                    />
                    <span className="text-[13px]" style={{ color: "hsl(var(--metal-foreground))" }}>
                      {b}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href={bundle.href}>
                <motion.button
                  whileTap={TACTILE_PRESS_WHILETAP}
                  transition={SPRING}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2"
                  style={
                    bundle.highlight
                      ? {
                          background: "hsl(263 70% 58%)",
                          color: "hsl(0 0% 100%)",
                        }
                      : {
                          background: "var(--metal-gradient)",
                          border: "1px solid hsl(var(--metal-border))",
                          color: "hsl(var(--metal-foreground))",
                        }
                  }
                >
                  {bundle.cta}
                </motion.button>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-xs mt-8"
          style={{ color: "hsl(var(--metal-shine))" }}
        >
          14-day refund policy · Secured by Dodo Payments (merchant of record)
        </motion.p>
      </div>
    </section>
  );
}
