"use client";
import React from "react";
import { CheckSquare } from "lucide-react";
import { BlockPlaceholder } from "./BlockPlaceholder";

export function FormValidationPreview() {
  return (
    <BlockPlaceholder
      name="Form Validation"
      icon={<CheckSquare size={14} style={{ color: "#3fb950" }} />}
      lines={[
        { label: "Schema",   value: "Zod + RHF v7",   color: "#79c0ff" },
        { label: "Fields",   value: "name email pass", color: "#c9d1d9" },
        { label: "Errors",   value: "inline ARIA",     color: "#fbbf24" },
        { label: "Async",    value: "server check ✓",  color: "#3fb950" },
        { label: "Submit",   value: "loading state",   color: "#6e7681" },
      ]}
    />
  );
}
