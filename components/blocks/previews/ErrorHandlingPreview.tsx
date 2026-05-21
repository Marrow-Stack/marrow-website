"use client";
import React from "react";
import { AlertTriangle } from "lucide-react";
import { BlockPlaceholder } from "./BlockPlaceholder";

export function ErrorHandlingPreview() {
  return (
    <BlockPlaceholder
      name="Error Handling"
      icon={<AlertTriangle size={14} style={{ color: "#f85149" }} />}
      lines={[
        { label: "Class",   value: "NotFoundError",  color: "#ff7b72" },
        { label: "Code",    value: "NOT_FOUND",      color: "#fbbf24" },
        { label: "Status",  value: "404",            color: "#f85149" },
        { label: "Level",   value: "WARN",           color: "#fbbf24" },
        { label: "Logged",  value: "stdout JSON",    color: "#6e7681" },
      ]}
    />
  );
}
