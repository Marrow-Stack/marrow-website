"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, Shield, Puzzle, Code2 } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Ship in Hours",
    body: "Drop a `.ts` file into your project. Every block is a self-contained server action — no wiring, no boilerplate.",
  },
  {
    icon: Shield,
    title: "Security First",
    body: "bcrypt hashing, token expiry, account lockout, RBAC guards — hardened defaults baked in at every layer.",
  },
  {
    icon: Code2,
    title: "Type-Safe to the Core",
    body: "Strict TypeScript throughout. Zod-validated inputs, typed DB adapters, and exhaustive union types.",
  },
  {
    icon: Puzzle,
    title: "ORM Agnostic",
    body: "Bring your own database adapter. Works with Prisma, Drizzle, Supabase, or any repository pattern.",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-16"
        >
          <p
            className="text-xs font-bold uppercase tracking-[0.2em] mb-4"
            style={{ color: "hsl(var(--accent-mineral))" }}
          >
            Why Marrow
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-reveal-light leading-tight">
            Engineered, not assembled
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                className="group p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg"
                style={{
                  background: "var(--metal-gradient)",
                  borderColor: "hsl(var(--metal-border))",
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 border"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderColor: "hsl(var(--metal-border))",
                  }}
                >
                  <Icon size={16} style={{ color: "hsl(var(--metal-foreground))" }} />
                </div>
                <h3
                  className="text-sm font-bold mb-2"
                  style={{ color: "hsl(var(--metal-foreground))" }}
                >
                  {f.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--accent-mineral))" }}>
                  {f.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
