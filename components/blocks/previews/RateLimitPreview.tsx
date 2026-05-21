"use client";
import React from "react";
import { Shield } from "lucide-react";
import { BlockPlaceholder } from "./BlockPlaceholder";

export function RateLimitPreview() {
  return (
    <BlockPlaceholder
      name="Rate Limiting"
      icon={<Shield size={14} style={{ color: "#ff7b72" }} />}
      lines={[
        { label: "Identifier", value: "192.168.1.1",    color: "#79c0ff" },
        { label: "Window",     value: "10 seconds",     color: "#c9d1d9" },
        { label: "Limit",      value: "20 requests",    color: "#fbbf24" },
        { label: "Remaining",  value: "7",              color: "#3fb950" },
        { label: "Resets in",  value: "4 s",            color: "#6e7681" },
      ]}
    />
  );
}
