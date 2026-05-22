"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CliCopyButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  function handleClick() {
    navigator.clipboard?.writeText(`npx marrowstack add ${slug}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
      style={{
        borderColor: "hsl(var(--metal-border))",
        color: "hsl(var(--metal-shine))",
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
