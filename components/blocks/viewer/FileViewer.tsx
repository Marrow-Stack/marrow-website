"use client";

import React, { useState, useCallback, useTransition } from "react";
import { motion } from "framer-motion";
import { Copy, ExternalLink, FileText, Check, Lock, ChevronDown, ChevronRight } from "lucide-react";
import type { BlockFile, BlockSource } from "@/lib/github/fetch";
import { TactileButton } from "@/components/marrow/TactileButton";

// ─── Copy utility ─────────────────────────────────────────────────────────────

async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }
  // Fallback for older browsers
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(ta);
  return ok;
}

// ─── Syntax highlight via Shiki (dynamic import to keep Shiki out of index bundle)

async function highlight(code: string, lang: string): Promise<string> {
  const { codeToHtml } = await import("shiki");
  return codeToHtml(code, {
    lang,
    themes: { dark: "github-dark-dimmed", light: "github-light" },
    defaultColor: false,
  });
}

// ─── File sidebar ─────────────────────────────────────────────────────────────

interface FileSidebarProps {
  files: BlockFile[];
  selected: string;
  onSelect: (path: string) => void;
}

function FileSidebar({ files, selected, onSelect }: FileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="sm:hidden flex items-center gap-2 text-xs font-medium mb-3 px-3 py-2 rounded-lg border w-full"
        style={{
          background: "var(--metal-gradient)",
          borderColor: "hsl(var(--metal-border))",
          color: "hsl(var(--metal-foreground))",
        }}
        onClick={() => setOpen((p) => !p)}
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        {selected} ({files.length} files)
      </button>

      {/* Sidebar list */}
      <ul className={`space-y-0.5 ${open ? "block" : "hidden sm:block"}`}>
        {files.map((f) => (
          <li key={f.path}>
            <button
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-mono transition-all"
              style={{
                background: selected === f.path ? "hsl(var(--metal-border) / 0.5)" : "transparent",
                color:
                  selected === f.path
                    ? "hsl(var(--metal-foreground))"
                    : "hsl(var(--metal-shine))",
                borderLeft:
                  selected === f.path
                    ? "2px solid hsl(var(--metal-foreground))"
                    : "2px solid transparent",
              }}
              onClick={() => {
                onSelect(f.path);
                setOpen(false);
              }}
            >
              <FileText size={11} className="shrink-0 opacity-60" />
              <span className="truncate">{f.path}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

// ─── File pane ────────────────────────────────────────────────────────────────

interface FilePaneProps {
  slug: string;
  file: BlockFile;
  initialContent?: string;
  isSignedIn: boolean;
  repoOwner: string;
  repoName: string;
}

function FilePane({ slug, file, initialContent, isSignedIn, repoOwner, repoName }: FilePaneProps) {
  const [content, setContent] = useState<string | null>(initialContent ?? null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialContent);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  React.useEffect(() => {
    if (content) {
      highlight(content, file.language).then(setHighlighted).catch(() => {
        // If Shiki fails, show plain text
        setHighlighted(null);
      });
    }
  }, [content, file.language]);

  React.useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
      setLoading(false);
      return;
    }

    setLoading(true);
    setContent(null);
    setHighlighted(null);
    setError(null);

    fetch(`/api/blocks/${slug}/files?path=${encodeURIComponent(file.path)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.truncated) {
          setError("File too large to preview.");
        } else {
          setContent(data.content);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load file.");
        setLoading(false);
      });
  }, [slug, file.path, initialContent]);

  const handleCopy = useCallback(async () => {
    if (!content) return;
    const ok = await copyText(content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      // Record copy server-side (fire-and-forget)
      fetch("/api/copy-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, filePath: file.path }),
      }).catch(() => {});
    }
  }, [content, slug, file.path]);

  const githubUrl = `https://github.com/${repoOwner}/${repoName}/blob/main/${file.path}`;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "var(--metal-gradient)",
        borderColor: "hsl(var(--metal-border))",
      }}
    >
      {/* File header bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b gap-3"
        style={{
          borderColor: "hsl(var(--metal-border))",
          background: "hsl(var(--metal-border) / 0.2)",
        }}
      >
        <span
          className="text-xs font-mono truncate"
          style={{ color: "hsl(var(--metal-foreground))" }}
        >
          {file.path}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          {/* Copy */}
          {isSignedIn ? (
            <button
              onClick={handleCopy}
              disabled={!content}
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md border transition-all disabled:opacity-40"
              style={{
                borderColor: "hsl(var(--metal-border))",
                color: "hsl(var(--metal-shine))",
              }}
              title="Copy file contents"
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? "Copied" : "Copy"}
            </button>
          ) : (
            <span
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md border opacity-50 cursor-not-allowed"
              style={{
                borderColor: "hsl(var(--metal-border))",
                color: "hsl(var(--metal-shine))",
              }}
              title="Sign in to copy files"
            >
              <Lock size={11} />
              Copy
            </span>
          )}

          {/* Raw */}
          <a
            href={file.rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md border transition-all"
            style={{
              borderColor: "hsl(var(--metal-border))",
              color: "hsl(var(--metal-shine))",
            }}
          >
            Raw
          </a>

          {/* GitHub */}
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md border transition-all"
            style={{
              borderColor: "hsl(var(--metal-border))",
              color: "hsl(var(--metal-shine))",
            }}
          >
            GitHub
            <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Content area */}
      <div className="overflow-auto max-h-[640px] text-[13px]">
        {loading && (
          <div className="p-6 text-center" style={{ color: "hsl(var(--metal-shine))" }}>
            Loading…
          </div>
        )}
        {error && (
          <div className="p-6 text-center" style={{ color: "hsl(var(--metal-shine))" }}>
            {error}{" "}
            <a
              href={githubUrl}
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub →
            </a>
          </div>
        )}
        {!loading && !error && highlighted && (
          <div
            className="shiki-wrapper [&_pre]:p-5 [&_pre]:m-0 [&_pre]:overflow-x-auto [&_code]:font-mono dark:[&_.shiki-dark]:block [&_.shiki-dark]:hidden [&_.shiki-light]:block dark:[&_.shiki-light]:hidden"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        )}
        {!loading && !error && content && !highlighted && (
          <pre className="p-5 font-mono overflow-x-auto whitespace-pre">{content}</pre>
        )}
      </div>
    </div>
  );
}

// ─── Main FileViewer component ────────────────────────────────────────────────

interface FileViewerProps {
  source: BlockSource;
  isSignedIn: boolean;
  copyAllPayload: string;
}

export function FileViewer({ source, isSignedIn, copyAllPayload }: FileViewerProps) {
  const [selectedPath, setSelectedPath] = useState<string>(
    source.readme?.path ?? source.files[0]?.path ?? ""
  );
  const [copyAllDone, setCopyAllDone] = useState(false);

  const selectedFile = source.files.find((f) => f.path === selectedPath) ?? source.files[0];

  const handleCopyAll = useCallback(async () => {
    const ok = await copyText(copyAllPayload);
    if (ok) {
      setCopyAllDone(true);
      setTimeout(() => setCopyAllDone(false), 2500);
      fetch("/api/copy-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: source.slug, filePath: null }),
      }).catch(() => {});
    }
  }, [copyAllPayload, source.slug]);

  const lineCount = copyAllPayload.split("\n").length;

  return (
    <div>
      {/* Copy-all CTA */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {isSignedIn ? (
          <TactileButton
            variant="primary"
            size="md"
            onClick={handleCopyAll}
          >
            {copyAllDone ? (
              <>
                <Check size={14} />
                Copied {source.files.length} files
              </>
            ) : (
              <>
                <Copy size={14} />
                Copy all files
              </>
            )}
          </TactileButton>
        ) : (
          <div className="relative group">
            <TactileButton variant="primary" size="md" disabled>
              <Lock size={14} />
              Copy all files
            </TactileButton>
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10"
              style={{
                background: "hsl(var(--metal-foreground))",
                color: "hsl(var(--background))",
              }}
            >
              Sign in to copy files
            </div>
          </div>
        )}

        <span className="text-xs" style={{ color: "hsl(var(--metal-shine))" }}>
          {source.files.length} files · {lineCount.toLocaleString()} lines
        </span>

        <a
          href={`https://github.com/${source.repo.owner}/${source.repo.name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
          style={{ color: "hsl(var(--metal-shine))" }}
        >
          Open on GitHub
          <ExternalLink size={11} />
        </a>
      </div>

      {/* Sign-in hint for signed-out users */}
      {!isSignedIn && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-5 px-4 py-2.5 rounded-xl text-[12px] border"
          style={{
            background: "hsl(var(--metal-border) / 0.3)",
            borderColor: "hsl(var(--metal-border))",
            color: "hsl(var(--metal-shine))",
          }}
        >
          <Lock size={11} />
          <span>
            <a href="/auth/signin" className="font-medium underline">
              Sign in
            </a>{" "}
            to copy files. Viewing and opening on GitHub is always free.
          </span>
        </motion.div>
      )}

      {/* File viewer grid */}
      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4">
        {/* Sidebar */}
        <div>
          <FileSidebar
            files={source.files}
            selected={selectedPath}
            onSelect={setSelectedPath}
          />
        </div>

        {/* Right pane */}
        <div className="min-w-0">
          {selectedFile && (
            <FilePane
              slug={source.slug}
              file={selectedFile}
              initialContent={
                selectedFile.path === source.readme?.path
                  ? source.readme?.content
                  : undefined
              }
              isSignedIn={isSignedIn}
              repoOwner={source.repo.owner}
              repoName={source.repo.name}
            />
          )}
        </div>
      </div>
    </div>
  );
}
