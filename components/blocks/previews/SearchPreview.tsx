"use client";
import React from "react";
import { Search } from "lucide-react";
import { BlockPlaceholder } from "./BlockPlaceholder";

export function SearchPreview() {
  return (
    <BlockPlaceholder
      name="Full-Text Search"
      icon={<Search size={14} style={{ color: "#79c0ff" }} />}
      lines={[
        { label: "Query",    value: '"auth + oauth"',  color: "#a5d6ff" },
        { label: "Matches",  value: "12 results",      color: "#c9d1d9" },
        { label: "Rank",     value: "0.94 (A weight)", color: "#fbbf24" },
        { label: "Index",    value: "tsvector GIN",    color: "#79c0ff" },
        { label: "Latency",  value: "4 ms",            color: "#3fb950" },
      ]}
    />
  );
}
