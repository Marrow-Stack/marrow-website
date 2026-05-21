"use client";
import React from "react";
import { Mail } from "lucide-react";
import { BlockPlaceholder } from "./BlockPlaceholder";

export function EmailPreview() {
  return (
    <BlockPlaceholder
      name="Email System"
      icon={<Mail size={14} style={{ color: "#a78bfa" }} />}
      lines={[
        { label: "Template", value: "welcome",         color: "#79c0ff" },
        { label: "To",       value: "jane@example.com", color: "#c9d1d9" },
        { label: "From",     value: "noreply@app.com",  color: "#6e7681" },
        { label: "Sent",     value: "just now",         color: "#3fb950" },
        { label: "Message",  value: "abc123",           color: "#6e7681" },
      ]}
    />
  );
}
