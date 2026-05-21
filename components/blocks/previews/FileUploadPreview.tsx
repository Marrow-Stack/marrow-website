"use client";
import React from "react";
import { Upload } from "lucide-react";
import { BlockPlaceholder } from "./BlockPlaceholder";

export function FileUploadPreview() {
  return (
    <BlockPlaceholder
      name="File Upload"
      icon={<Upload size={14} style={{ color: "#3fb950" }} />}
      lines={[
        { label: "File",     value: "avatar.png",      color: "#c9d1d9" },
        { label: "Size",     value: "142 KB",          color: "#6e7681" },
        { label: "Bucket",   value: "avatars",         color: "#79c0ff" },
        { label: "Progress", value: "100%",            color: "#3fb950" },
        { label: "URL",      value: "cdn.supabase.co", color: "#a78bfa" },
      ]}
    />
  );
}
