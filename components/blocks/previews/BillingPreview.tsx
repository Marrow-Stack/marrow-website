"use client";
import React from "react";
import { CreditCard } from "lucide-react";
import { BlockPlaceholder } from "./BlockPlaceholder";

export function BillingPreview() {
  return (
    <BlockPlaceholder
      name="Billing & Subscriptions"
      icon={<CreditCard size={14} style={{ color: "#fbbf24" }} />}
      lines={[
        { label: "Plan",         value: "Pro",         color: "#a78bfa" },
        { label: "Interval",     value: "monthly",     color: "#79c0ff" },
        { label: "Status",       value: "active",      color: "#3fb950" },
        { label: "Next renewal", value: "2026-06-21",  color: "#c9d1d9" },
        { label: "Amount",       value: "$39.00",      color: "#fbbf24" },
      ]}
    />
  );
}
