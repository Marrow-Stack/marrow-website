"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight } from "lucide-react";
import { RefractiveDock } from "@/components/navbar";

type NavLeaf   = { label: string; href: string };
type NavGroup  = { label: string; children: NavLeaf[] };
type NavItem   = NavLeaf | NavGroup;

const NAV: NavItem[] = [
  { label: "Overview",          href: "/docs" },
  { label: "After You Buy",     href: "/docs/after-you-buy" },
  { label: "Getting Started",   href: "/docs/getting-started" },
  {
    label: "Blocks",
    children: [
      { label: "Auth System",          href: "/docs/blocks/auth" },
      { label: "Admin Dashboard",      href: "/docs/blocks/admin" },
      { label: "Team Workspace",       href: "/docs/blocks/teamspace" },
      { label: "Solana Auth (SIWS)",   href: "/docs/blocks/solana-auth" },
      { label: "Solana Payments",      href: "/docs/blocks/solana-payments" },
    ],
  },
  { label: "Security",          href: "/docs/security" },
  { label: "FAQ",               href: "/docs/faq" },
];

function NavLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active   = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] transition-all"
      style={{
        background:  active ? "hsl(var(--metal-border))" : "transparent",
        color:       active ? "hsl(var(--metal-foreground))" : "hsl(var(--accent-mineral))",
        fontWeight:  active ? 600 : 400,
      }}
    >
      {active && <ChevronRight size={11} />}
      {label}
    </Link>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  return (
    <div className="py-6 px-4 space-y-6">
      {NAV.map((item) => (
        <div key={item.label}>
          {"children" in item ? (
            <>
              <p
                className="text-[10px] font-bold uppercase tracking-widest px-3 mb-1"
                style={{ color: "hsl(var(--metal-shine))" }}
              >
                {item.label}
              </p>
              <div className="space-y-0.5">
                {(item as NavGroup).children.map((child) => (
                  <NavLink key={child.href} href={child.href} label={child.label} onClick={onClose} />
                ))}
              </div>
            </>
          ) : (
            <NavLink href={(item as NavLeaf).href} label={item.label} onClick={onClose} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen font-display">
      <RefractiveDock />

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-0 left-0 bottom-0 w-72 z-50 overflow-y-auto lg:hidden"
            style={{
              background: "var(--background)",
              borderRight: "1px solid hsl(var(--metal-border))",
            }}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "hsl(var(--metal-border))" }}>
              <p className="font-bold text-sm" style={{ color: "hsl(var(--metal-foreground))" }}>Docs</p>
              <button onClick={() => setOpen(false)} style={{ color: "hsl(var(--metal-shine))" }}>
                <X size={18} />
              </button>
            </div>
            <Sidebar onClose={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex pt-24">
        {/* Desktop sidebar */}
        <aside
          className="hidden lg:block w-60 shrink-0 sticky top-24 self-start h-[calc(100vh-6rem)] overflow-y-auto border-r"
          style={{ borderColor: "hsl(var(--metal-border))" }}
        >
          <Sidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Mobile nav toggle */}
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "hsl(var(--metal-border))" }}>
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 text-xs"
              style={{ color: "hsl(var(--metal-shine))" }}
            >
              <Menu size={16} />
              Navigation
            </button>
          </div>

          <div className="max-w-3xl mx-auto px-6 py-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
