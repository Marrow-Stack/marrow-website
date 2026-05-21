import React from "react";
import Link from "next/link";

const LINKS = {
  Product: [
    { label: "All Blocks",        href: "/blocks" },
    { label: "Solana Auth",       href: "/blocks/solana-auth" },
    { label: "Solana Payments",   href: "/blocks/solana-payments" },
    { label: "Auth System",       href: "/blocks/auth" },
    { label: "Admin Dashboard",   href: "/blocks/admin" },
    { label: "Affiliate",         href: "/affiliate" },
  ],
  Resources: [
    { label: "Documentation",     href: "/docs" },
    { label: "After You Buy",     href: "/docs/after-you-buy" },
    { label: "Changelog",         href: "/changelog" },
    { label: "Security Model",    href: "/docs/security" },
    { label: "FAQ",               href: "/docs/faq" },
  ],
  Company: [
    { label: "About",             href: "/about" },
    { label: "Privacy Policy",    href: "/privacy" },
    { label: "Terms of Service",  href: "/terms" },
    { label: "License",           href: "/docs/faq#licensing" },
  ],
};

export function Footer() {
  return (
    <footer
      className="relative border-t py-16 px-4"
      style={{ borderColor: "hsl(var(--metal-border))" }}
    >
      <div className="container mx-auto max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <p className="font-black text-base mb-2" style={{ color: "hsl(var(--metal-foreground))" }}>
              MarrowStack
            </p>
            <p className="text-[13px] leading-relaxed mb-4" style={{ color: "hsl(var(--accent-mineral))" }}>
              Production-ready TypeScript blocks for Next.js. Buy once, own forever.
            </p>
            <a
              href="mailto:samarth@marrowstack.dev"
              className="text-[12px] transition-opacity hover:opacity-80"
              style={{ color: "hsl(var(--metal-shine))" }}
            >
              samarth@marrowstack.dev
            </a>
          </div>

          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-4"
                style={{ color: "hsl(var(--metal-shine))" }}
              >
                {group}
              </p>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[13px] transition-opacity hover:opacity-80"
                      style={{ color: "hsl(var(--accent-mineral))" }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t"
          style={{ borderColor: "hsl(var(--metal-border))" }}
        >
          <p className="text-xs" style={{ color: "hsl(var(--metal-shine))" }}>
            © {new Date().getFullYear()} MarrowStack · Built by Samarth Shukla
          </p>
          <p className="text-xs" style={{ color: "hsl(var(--metal-shine))" }}>
            Payments by{" "}
            <span className="font-semibold" style={{ color: "hsl(var(--metal-foreground))" }}>
              Dodo Payments
            </span>
            {" "}· Merchant of Record
          </p>
        </div>
      </div>
    </footer>
  );
}
