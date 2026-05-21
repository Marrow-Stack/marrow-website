"use client";
import React from "react";
import { Bell } from "lucide-react";
import { BlockPlaceholder } from "./BlockPlaceholder";

export function NotificationsPreview() {
  return (
    <BlockPlaceholder
      name="Notifications System"
      icon={<Bell size={14} style={{ color: "#fbbf24" }} />}
      lines={[
        { label: "Type",      value: "success",         color: "#3fb950" },
        { label: "Title",     value: "Block delivered!", color: "#c9d1d9" },
        { label: "Channel",   value: "in-app + push",   color: "#79c0ff" },
        { label: "Unread",    value: "3",               color: "#fbbf24" },
        { label: "Delivered", value: "just now",        color: "#6e7681" },
      ]}
    />
  );
}
