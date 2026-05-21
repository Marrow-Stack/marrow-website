"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";

const TIERS = [
  {
    name: "Per Block",
    price: "From $39",
    description: "Pick exactly what you need. One-time payment, lifetime access.",
    features: [
      "Full TypeScript source",
      "Lifetime updates",
      "Commercial license",
      "Email support",
    ],
    cta: "Browse blocks",
    href: "/blocks",
    highlight: false,
  },
  {
    name: "All Access",
    price: "$149",
    description: "Every block, current and future. The only plan serious teams need.",
    features: [
      "All 5 blocks (+ future releases)",
      "Lifetime updates included",
      "Priority email support",
      "Early access to new blocks",
      "Commercial license",
    ],
    cta: "Get All Access",
    href: "/blocks",
    highlight: true,
  },
];

export function PricingSection() {
  return (
    <section className="relative py-24 px-4">
      <div className="container mx-auto max-w-3xl">
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
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-reveal-light leading-tight">
            Pay once. Own it forever.
          </h2>
          <p className="mt-4 text-sm" style={{ color: "hsl(var(--accent-mineral))" }}>
            No subscriptions. No seat limits. No lock-in.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
              className="relative rounded-2xl border p-7 flex flex-col"
              style={{
                background: tier.highlight
                  ? "linear-gradient(145deg, rgba(109,40,217,0.15) 0%, rgba(13,17,23,0.9) 100%)"
                  : "var(--metal-gradient)",
                borderColor: tier.highlight
                  ? "rgba(109,40,217,0.4)"
                  : "hsl(var(--metal-border))",
                boxShadow: tier.highlight ? "0 0 40px rgba(109,40,217,0.12)" : "none",
              }}
            >
              {tier.highlight && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: "rgba(109,40,217,1)", color: "#fff" }}
                >
                  <Zap size={9} />
                  Best Value
                </div>
              )}

              <div className="mb-6">
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: tier.highlight ? "#a78bfa" : "hsl(var(--accent-mineral))" }}
                >
                  {tier.name}
                </p>
                <p
                  className="text-3xl font-black mb-2"
                  style={{ color: "hsl(var(--metal-foreground))" }}
                >
                  {tier.price}
                </p>
                <p className="text-[13px]" style={{ color: "hsl(var(--accent-mineral))" }}>
                  {tier.description}
                </p>
              </div>

              <ul className="space-y-3 flex-1 mb-7">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check
                      size={13}
                      className="mt-0.5 shrink-0"
                      style={{ color: tier.highlight ? "#a78bfa" : "hsl(var(--metal-shine))" }}
                    />
                    <span className="text-[13px]" style={{ color: "hsl(var(--metal-foreground))" }}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href={tier.href}>
                <motion.button
                  whileTap={{ y: 3 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-metal-shine focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  style={
                    tier.highlight
                      ? {
                          background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                          color: "#fff",
                          boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
                        }
                      : {
                          background: "var(--metal-gradient)",
                          border: "1px solid hsl(var(--metal-border))",
                          color: "hsl(var(--metal-foreground))",
                        }
                  }
                >
                  {tier.cta}
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
          All purchases come with a 7-day refund policy. Secured by Dodo Payments.
        </motion.p>
      </div>
    </section>
  );
}
