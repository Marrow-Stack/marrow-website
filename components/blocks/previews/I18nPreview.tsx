"use client";
import React from "react";
import { Languages } from "lucide-react";
import { BlockPlaceholder } from "./BlockPlaceholder";

export function I18nPreview() {
  return (
    <BlockPlaceholder
      name="Internationalization"
      icon={<Languages size={14} style={{ color: "#79c0ff" }} />}
      lines={[
        { label: "Locale",    value: "ar",              color: "#fbbf24" },
        { label: "Direction", value: "rtl",             color: "#ff7b72" },
        { label: "Currency",  value: "٤٩٫٠٠ دولار",    color: "#c9d1d9" },
        { label: "Date",      value: "٢١ مايو ٢٠٢٦",   color: "#6e7681" },
        { label: "Locales",   value: "en fr de ar ja",  color: "#a78bfa" },
      ]}
    />
  );
}
