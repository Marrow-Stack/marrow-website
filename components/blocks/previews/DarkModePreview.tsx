"use client";
import React from "react";
import { Moon } from "lucide-react";
import { BlockPlaceholder } from "./BlockPlaceholder";

export function DarkModePreview() {
  return (
    <BlockPlaceholder
      name="Dark Mode Toggle"
      icon={<Moon size={14} style={{ color: "#a78bfa" }} />}
      lines={[
        { label: "Theme",    value: "dark",        color: "#a78bfa" },
        { label: "Accent",   value: "violet",      color: "#c4b5fd" },
        { label: "Source",   value: "system",      color: "#6e7681" },
        { label: "Schedule", value: "auto sunset",  color: "#fbbf24" },
        { label: "FOUC",     value: "prevented",   color: "#3fb950" },
      ]}
    />
  );
}
