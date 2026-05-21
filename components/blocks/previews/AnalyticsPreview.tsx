"use client";
import React from "react";
import { BarChart2 } from "lucide-react";
import { BlockPlaceholder } from "./BlockPlaceholder";

export function AnalyticsPreview() {
  return (
    <BlockPlaceholder
      name="Analytics Tracker"
      icon={<BarChart2 size={14} style={{ color: "#fbbf24" }} />}
      lines={[
        { label: "Event",    value: "checkout_started",  color: "#ff7b72" },
        { label: "Block",    value: "auth",              color: "#79c0ff" },
        { label: "Price",    value: "$29",               color: "#fbbf24" },
        { label: "Sink",     value: "PostHog",           color: "#a78bfa" },
        { label: "Session",  value: "sess_8xK...",       color: "#6e7681" },
      ]}
    />
  );
}
