"use client";
import React from "react";
import { DollarSign } from "lucide-react";
import { BlockPlaceholder } from "./BlockPlaceholder";

export function PaymentsPreview() {
  return (
    <BlockPlaceholder
      name="PayPal Checkout"
      icon={<DollarSign size={14} style={{ color: "#79c0ff" }} />}
      lines={[
        { label: "Order ID",  value: "9XM72...",   color: "#79c0ff" },
        { label: "Amount",    value: "$49.00 USD",  color: "#fbbf24" },
        { label: "Status",    value: "COMPLETED",  color: "#3fb950" },
        { label: "Payer",     value: "jane@...",    color: "#c9d1d9" },
        { label: "Captured",  value: "just now",    color: "#6e7681" },
      ]}
    />
  );
}
