"use client";
import React from "react";
import { User } from "lucide-react";
import { BlockPlaceholder } from "./BlockPlaceholder";

export function ProfilePreview() {
  return (
    <BlockPlaceholder
      name="User Profile"
      icon={<User size={14} style={{ color: "#79c0ff" }} />}
      lines={[
        { label: "Username",     value: "@janedoe",       color: "#a78bfa" },
        { label: "Display name", value: "Jane Doe",       color: "#c9d1d9" },
        { label: "Avatar",       value: "uploaded ✓",     color: "#3fb950" },
        { label: "Bio",          value: "Building...",    color: "#6e7681" },
        { label: "Website",      value: "jane.dev",       color: "#79c0ff" },
      ]}
    />
  );
}
