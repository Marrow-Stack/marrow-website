"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Code2, BookOpen } from "lucide-react";
import { CodeViewer } from "./CodeViewer";
import type { MarrowBlock } from "@/lib/blocks-data";

interface PlaygroundTabsProps {
  block: MarrowBlock;
  PreviewComponent: React.ComponentType;
}

const TABS = [
  { id: "preview", label: "Preview", icon: Monitor },
  { id: "code",    label: "Code",    icon: Code2 },
  { id: "usage",   label: "Usage",   icon: BookOpen },
] as const;

type TabId = typeof TABS[number]["id"];

export function PlaygroundTabs({ block, PreviewComponent }: PlaygroundTabsProps) {
  const [active, setActive] = useState<TabId>("preview");

  return (
    <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
      {/* Tab bar */}
      <div
        className="flex items-center gap-1 px-3 py-2 border-b"
        style={{ background: "rgba(22,27,34,0.9)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ color: isActive ? "#c9d1d9" : "#6e7681" }}
            >
              {isActive && (
                <motion.div
                  layoutId="playground-tab-bg"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                />
              )}
              <Icon size={12} className="relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          <span
            className="text-[10px] px-2 py-1 rounded-full font-mono"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#6e7681",
            }}
          >
            {block.linesOfCode} lines
          </span>
          <span
            className="text-[10px] px-2 py-1 rounded-full font-mono"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#6e7681",
            }}
          >
            {block.fileCount} file{block.fileCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Tab content */}
      <div
        className="relative min-h-[460px]"
        style={{ background: "rgba(13,17,23,0.8)" }}
      >
        <AnimatePresence mode="wait">
          {active === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <PreviewComponent />
            </motion.div>
          )}

          {active === "code" && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="text-[11px] px-2 py-1 rounded"
                  style={{
                    background: "rgba(255,123,114,0.1)",
                    border: "1px solid rgba(255,123,114,0.2)",
                    color: "#ff7b72",
                  }}
                >
                  teaser — purchase for full source
                </span>
              </div>
              <CodeViewer
                code={block.teaserCode}
                filename={`${block.slug}.ts`}
                maxHeight="380px"
              />
            </motion.div>
          )}

          {active === "usage" && (
            <motion.div
              key="usage"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="text-[11px] px-2 py-1 rounded"
                  style={{
                    background: "rgba(121,192,255,0.1)",
                    border: "1px solid rgba(121,192,255,0.2)",
                    color: "#79c0ff",
                  }}
                >
                  integration example
                </span>
              </div>
              <CodeViewer
                code={block.usageCode}
                filename={`example.ts`}
                maxHeight="380px"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
