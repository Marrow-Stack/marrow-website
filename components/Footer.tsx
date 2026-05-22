import React from "react";
import Link from "next/link";

const LINKS = {
  Product: [
    { label: "Blocks",       href: "/blocks" },
    { label: "Docs",         href: "/docs" },
    { label: "Changelog",    href: "/changelog" },
    { label: "CLI (soon)",   href: "/cli" },
  ],
  Resources: [
    { label: "Getting started", href: "/docs/getting-started" },
    { label: "FAQ",             href: "/docs/faq" },
    { label: "About",           href: "/about" },
  ],
  Legal: [
    { label: "Privacy",  href: "/privacy" },
    { label: "Terms",    href: "/terms" },
  ],
};

export function Footer() {
  const ownerGithubUrl = process.env.NEXT_PUBLIC_OWNER_GITHUB_URL ?? "https://github.com/Marrow-Stack";

  return (
    <footer
      className="relative border-t py-16 px-4"
      style={{ borderColor: "hsl(var(--metal-border))" }}
    >
      <div className="container mx-auto max-w-5xl">
        {/* Top link bar */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-12 text-[13px]">
          {[
            { label: "Blocks", href: "/blocks" },
            { label: "Docs", href: "/docs" },
            { label: "Changelog", href: "/changelog" },
            { label: "About", href: "/about" },
            { label: "CLI (soon)", href: "/cli" },
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="transition-opacity hover:opacity-80"
              style={{ color: "hsl(var(--accent-mineral))" }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-8 border-t"
          style={{ borderColor: "hsl(var(--metal-border))" }}
        >
          <div className="space-y-1">
            <a
              href="mailto:samarthofficial52@gmail.com"
              className="block text-[12px] transition-opacity hover:opacity-80"
              style={{ color: "hsl(var(--metal-shine))" }}
            >
              samarthofficial52@gmail.com
            </a>
            <a
              href="https://github.com/Marrow-Stack"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[12px] transition-opacity hover:opacity-80"
              style={{ color: "hsl(var(--metal-shine))" }}
            >
              github.com/Marrow-Stack
            </a>
          </div>

          <p className="text-[12px] text-right" style={{ color: "hsl(var(--metal-shine))" }}>
            Built by{" "}
            <a
              href={ownerGithubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold transition-opacity hover:opacity-80"
              style={{ color: "hsl(var(--metal-foreground))" }}
            >
              Samarth Shukla
            </a>
            {" "}— open source, MIT, made in India.
            <br />
            © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
