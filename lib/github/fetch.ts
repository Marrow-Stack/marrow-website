import { getBlock } from "@/lib/blocks/registry";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlockFile {
  path: string;
  size: number;
  sha: string;
  rawUrl: string;
  language: string;
}

export interface BlockSource {
  slug: string;
  repo: { owner: string; name: string; ref: string };
  ref: string;
  refResolvedAt: string;
  files: BlockFile[];
  readme: { path: string; content: string } | null;
}

export interface BlockFileContent {
  path: string;
  content: string;
  truncated: boolean;
  bytes: number;
}

export class BlockNotAvailableError extends Error {
  constructor(slug: string) {
    super(`Block "${slug}" is not available — it may be a teaser or an unknown slug.`);
    this.name = "BlockNotAvailableError";
  }
}

export class BlockPathError extends Error {
  constructor(path: string) {
    super(`Path "${path}" is not valid or not part of this block's file list.`);
    this.name = "BlockPathError";
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 500 * 1024; // 500 KB

const IGNORED_NAMES = new Set([
  "LICENSE",
  "license",
  "package-lock.json",
  "bun.lockb",
  "yarn.lock",
  "pnpm-lock.yaml",
  ".gitignore",
  ".gitattributes",
  "node_modules",
  ".github",
  ".vscode",
  ".idea",
]);

const SORT_ORDER: Record<string, number> = {
  md: 0,
  tsx: 1,
  ts: 2,
  jsx: 3,
  js: 4,
  json: 5,
  sql: 6,
  css: 7,
};

const LANGUAGE_MAP: Record<string, string> = {
  tsx: "tsx",
  ts: "typescript",
  jsx: "jsx",
  js: "javascript",
  json: "json",
  md: "markdown",
  sql: "sql",
  css: "css",
  html: "html",
  sh: "bash",
  bash: "bash",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ext(path: string): string {
  return path.split(".").pop()?.toLowerCase() ?? "";
}

function languageFor(path: string): string {
  return LANGUAGE_MAP[ext(path)] ?? "text";
}

function sortOrder(path: string): number {
  const e = ext(path);
  // Readme-type files always first
  if (path.toLowerCase().startsWith("readme") || path.toLowerCase().startsWith("readme.")) return -1;
  return SORT_ORDER[e] ?? 99;
}

function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  } else if (process.env.NODE_ENV === "production") {
    console.warn("[github/fetch] GITHUB_TOKEN is not set — rate limit is 60 req/hr per IP");
  }
  return headers;
}

async function ghFetch(url: string, tags: string[], revalidate: number): Promise<Response> {
  const res = await fetch(url, {
    headers: githubHeaders(),
    next: { revalidate, tags },
  });

  const remaining = res.headers.get("X-RateLimit-Remaining");
  if (remaining !== null && parseInt(remaining) < 100) {
    console.warn(`[github/fetch] Rate limit low: ${remaining} requests remaining`);
  }

  return res;
}

function isIgnored(name: string): boolean {
  if (IGNORED_NAMES.has(name)) return true;
  if (name.startsWith(".")) return true;
  return false;
}

function normalizePath(path: string): string {
  return path.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/^﻿/, "");
}

// ─── Core API ─────────────────────────────────────────────────────────────────

export async function listBlockFiles(slug: string): Promise<BlockSource> {
  const block = getBlock(slug);
  if (!block || block.status !== "available" || !block.repo) {
    throw new BlockNotAvailableError(slug);
  }

  const { owner, name, ref } = block.repo;

  // 1. Resolve ref to a commit SHA so all downstream fetches are pinned
  const commitRes = await ghFetch(
    `https://api.github.com/repos/${owner}/${name}/commits/${ref}`,
    [`gh:block:${slug}`],
    3600
  );

  if (!commitRes.ok) {
    if (commitRes.status === 404) {
      throw new Error(`Repo ${owner}/${name} not found or has no commits on ref "${ref}"`);
    }
    throw new Error(`GitHub API error ${commitRes.status} resolving ref for ${slug}`);
  }

  const commitData = await commitRes.json();
  const sha: string = commitData.sha;
  const refResolvedAt = new Date().toISOString();

  // 2. List repo contents at the pinned SHA
  const contentsRes = await ghFetch(
    `https://api.github.com/repos/${owner}/${name}/contents/?ref=${sha}`,
    [`gh:block:${slug}`],
    3600
  );

  if (!contentsRes.ok) {
    throw new Error(`GitHub API error ${contentsRes.status} listing files for ${slug}`);
  }

  const rawContents: Array<{
    name: string;
    type: string;
    size: number;
    sha: string;
    path: string;
    download_url: string | null;
  }> = await contentsRes.json();

  // 3. Filter and build file list
  const files: BlockFile[] = rawContents
    .filter((f) => f.type === "file" && !isIgnored(f.name))
    .map((f) => ({
      path: f.path,
      size: f.size,
      sha: f.sha,
      rawUrl: `https://raw.githubusercontent.com/${owner}/${name}/${sha}/${f.path}`,
      language: languageFor(f.path),
    }))
    .sort((a, b) => {
      const orderDiff = sortOrder(a.path) - sortOrder(b.path);
      if (orderDiff !== 0) return orderDiff;
      return a.path.localeCompare(b.path);
    });

  // 4. Identify the readme (case-sensitive check against actual filenames)
  const readmeFile = files.find(
    (f) => f.path === block.repo!.readmeFile || f.path.toLowerCase() === "readme.md"
  );

  let readme: BlockSource["readme"] = null;
  if (readmeFile) {
    const content = await getBlockFile(slug, readmeFile.path);
    readme = { path: readmeFile.path, content: content.content };
  }

  return {
    slug,
    repo: { owner, name, ref },
    ref: sha,
    refResolvedAt,
    files,
    readme,
  };
}

export async function getBlockFile(slug: string, filePath: string): Promise<BlockFileContent> {
  const block = getBlock(slug);
  if (!block || block.status !== "available" || !block.repo) {
    throw new BlockNotAvailableError(slug);
  }

  // Validate path — must not be a traversal attempt
  if (
    filePath.includes("..") ||
    filePath.startsWith("/") ||
    filePath.startsWith("\\") ||
    filePath.includes("\\")
  ) {
    throw new BlockPathError(filePath);
  }

  const { owner, name } = block.repo;

  // Resolve sha first (cached) to build an immutable raw URL
  const commitRes = await ghFetch(
    `https://api.github.com/repos/${owner}/${name}/commits/${block.repo.ref}`,
    [`gh:block:${slug}`],
    3600
  );
  if (!commitRes.ok) throw new Error(`Could not resolve ref for block "${slug}"`);
  const { sha } = await commitRes.json();

  const rawUrl = `https://raw.githubusercontent.com/${owner}/${name}/${sha}/${filePath}`;

  const fileRes = await ghFetch(rawUrl, [`gh:file:${slug}:${sha}:${filePath}`], 86400);

  if (fileRes.status === 404) {
    throw new BlockPathError(filePath);
  }
  if (!fileRes.ok) {
    throw new Error(`GitHub raw fetch error ${fileRes.status} for ${filePath}`);
  }

  const contentLength = fileRes.headers.get("content-length");
  const bytes = contentLength ? parseInt(contentLength) : 0;

  if (bytes > MAX_FILE_BYTES) {
    return {
      path: filePath,
      content: "",
      truncated: true,
      bytes,
    };
  }

  const raw = await fileRes.text();
  return {
    path: filePath,
    content: normalizePath(raw),
    truncated: false,
    bytes: raw.length,
  };
}

// ─── Copy-all payload ─────────────────────────────────────────────────────────

export function buildCopyAllPayload(
  source: BlockSource,
  fileContents: Map<string, string>
): string {
  const lines: string[] = [
    `// MarrowStack — ${source.slug}`,
    `// Source: https://github.com/${source.repo.owner}/${source.repo.name}`,
    `// Pinned: commit ${source.ref}`,
    `// License: MIT`,
    `// Generated: ${new Date().toISOString()}`,
    "",
  ];

  for (const file of source.files) {
    const content = fileContents.get(file.path);
    if (content !== undefined) {
      lines.push(`// === ${file.path} ===`);
      lines.push(content);
      lines.push("");
    }
  }

  return lines.join("\n");
}
