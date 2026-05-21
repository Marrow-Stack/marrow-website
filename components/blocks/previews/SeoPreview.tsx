"use client";
import React from "react";
import { Globe } from "lucide-react";
import { BlockPlaceholder } from "./BlockPlaceholder";

export function SeoPreview() {
  return (
    <BlockPlaceholder
      name="SEO Toolkit"
      icon={<Globe size={14} style={{ color: "#3fb950" }} />}
      lines={[
        { label: "Title",      value: "Auth Block — App", color: "#c9d1d9" },
        { label: "OG Image",   value: "/og/auth.jpg",     color: "#79c0ff" },
        { label: "JSON-LD",    value: "Product schema",   color: "#fbbf24" },
        { label: "Canonical",  value: "/blocks/auth",     color: "#a78bfa" },
        { label: "Sitemap",    value: "priority 0.8",     color: "#3fb950" },
      ]}
    />
  );
}
