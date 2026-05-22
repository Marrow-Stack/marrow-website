export type BlockCategory =
  | "auth"
  | "monetization"
  | "communication"
  | "content"
  | "utility"
  | "ui"
  | "solana";

export type BlockStatus = "available" | "teaser";

export interface BlockEntry {
  slug: string;
  name: string;
  description: string;
  category: BlockCategory;
  tags: string[];
  difficulty: "starter" | "intermediate" | "advanced";
  estimatedSetupMinutes: number;
  status: BlockStatus;
  repo?: {
    owner: "Marrow-Stack";
    name: string;
    readmeFile: string;
    ref: string;
  };
  teaserNote?: string;
}

export interface BundleEntry {
  slug: string;
  name: string;
  description: string;
  blockSlugs: string[];
  repo: {
    owner: "Marrow-Stack";
    name: string;
    ref: string;
  };
}

export const BLOCKS: BlockEntry[] = [
  // ── Auth & Users ──────────────────────────────────────────────────────────
  {
    slug: "auth",
    name: "Auth System",
    description:
      "Full authentication with email/password, GitHub and Google OAuth, email verification, password reset, account lockout, and role-based access control — all wired to Supabase.",
    category: "auth",
    tags: ["next-auth", "supabase", "bcrypt", "zod", "oauth", "rbac"],
    difficulty: "advanced",
    estimatedSetupMinutes: 20,
    status: "available",
    repo: { owner: "Marrow-Stack", name: "ms-block-auth", readmeFile: "Readme.md", ref: "main" },
  },
  {
    slug: "profile",
    name: "User Profile",
    description:
      "Profile editing form with avatar upload to Supabase Storage, Zod validation, notification preferences, and soft-delete account removal.",
    category: "auth",
    tags: ["supabase", "zod", "avatar", "storage"],
    difficulty: "starter",
    estimatedSetupMinutes: 4,
    status: "available",
    repo: { owner: "Marrow-Stack", name: "ms-block-profile", readmeFile: "README.md", ref: "main" },
  },
  {
    slug: "team",
    name: "Team Workspaces",
    description:
      "Multi-tenant workspace management with RBAC, member invitations, role management, and a full dashboard UI — backed by Supabase with row-level security.",
    category: "auth",
    tags: ["supabase", "rbac", "invitations", "workspaces", "resend"],
    difficulty: "advanced",
    estimatedSetupMinutes: 4,
    status: "available",
    repo: { owner: "Marrow-Stack", name: "ms-block-team", readmeFile: "Readme.md", ref: "main" },
  },
  {
    slug: "admin",
    name: "Admin Dashboard",
    description:
      "Responsive admin dashboard UI with sidebar nav, KPI stat cards, user table, security activity feed, and quick-action buttons — drop into any Next.js app.",
    category: "auth",
    tags: ["dashboard", "tailwind", "react", "typescript"],
    difficulty: "starter",
    estimatedSetupMinutes: 4,
    status: "available",
    repo: { owner: "Marrow-Stack", name: "ms-block-admin", readmeFile: "Readme.md", ref: "main" },
  },

  // ── Monetization ──────────────────────────────────────────────────────────
  {
    slug: "billing",
    name: "Billing & Subscriptions",
    description:
      "PayPal REST API integration for one-time orders, monthly and yearly subscriptions, refunds, webhook verification, usage tracking, and invoice generation — wired to Supabase.",
    category: "monetization",
    tags: ["paypal", "supabase", "subscriptions", "webhooks", "billing"],
    difficulty: "advanced",
    estimatedSetupMinutes: 3,
    status: "available",
    repo: { owner: "Marrow-Stack", name: "ms-block-billing", readmeFile: "README.md", ref: "main" },
  },
  {
    slug: "payments",
    name: "Payments",
    description:
      "PayPal Checkout v2 for one-time payments — order creation, capture, refunds, webhook verification, and INR display helpers with a module-level token cache.",
    category: "monetization",
    tags: ["paypal", "checkout", "webhooks", "typescript"],
    difficulty: "intermediate",
    estimatedSetupMinutes: 3,
    status: "available",
    repo: { owner: "Marrow-Stack", name: "ms-block-payments", readmeFile: "README.md", ref: "main" },
  },

  // ── Communication ─────────────────────────────────────────────────────────
  {
    slug: "email",
    name: "Email System",
    description:
      "Transactional email via Resend — welcome, verify, password reset, purchase receipt, refund, team invite, affiliate payout, and newsletter templates sharing one branded HTML layout.",
    category: "communication",
    tags: ["resend", "transactional", "templates", "html-email"],
    difficulty: "intermediate",
    estimatedSetupMinutes: 3,
    status: "available",
    repo: { owner: "Marrow-Stack", name: "ms-block-email", readmeFile: "README.md", ref: "main" },
  },
  {
    slug: "notifications",
    name: "Notifications",
    description:
      "Real-time in-app notifications via Supabase Realtime — unread badge, mark-as-read, archive, bulk ops, Web Push subscribe/unsubscribe, and a bell dropdown component.",
    category: "communication",
    tags: ["supabase-realtime", "web-push", "react", "notifications"],
    difficulty: "intermediate",
    estimatedSetupMinutes: 4,
    status: "available",
    repo: { owner: "Marrow-Stack", name: "ms-block-notifications", readmeFile: "README.md", ref: "main" },
  },

  // ── Content ───────────────────────────────────────────────────────────────
  {
    slug: "i18n",
    name: "Internationalization",
    description:
      "Locale routing, RTL support, and currency/date/number formatting for Next.js 14 using next-intl 3.x — ships with message files for English, French, German, Hindi, and Arabic.",
    category: "content",
    tags: ["next-intl", "rtl", "locale-routing", "i18n"],
    difficulty: "intermediate",
    estimatedSetupMinutes: 7,
    status: "available",
    repo: { owner: "Marrow-Stack", name: "ms-block-i8n", readmeFile: "README.md", ref: "main" },
  },
  {
    slug: "seo",
    name: "SEO Toolkit",
    description:
      "Metadata, JSON-LD schemas, sitemap, and robots helpers for Next.js 14 — covers product pages, articles, breadcrumbs, OG images, Twitter Cards, hreflang, and noindex.",
    category: "content",
    tags: ["metadata", "json-ld", "sitemap", "og-images", "next.js"],
    difficulty: "starter",
    estimatedSetupMinutes: 3,
    status: "available",
    repo: { owner: "Marrow-Stack", name: "ms-block-seo", readmeFile: "README.md", ref: "main" },
  },
  {
    slug: "forms",
    name: "Form Validation",
    description:
      "Typed form primitives and three pre-built forms for Next.js 14+ — built on React Hook Form and Zod, with server-side validation and a multi-step form hook.",
    category: "content",
    tags: ["react-hook-form", "zod", "typescript", "validation"],
    difficulty: "starter",
    estimatedSetupMinutes: 2,
    status: "available",
    repo: { owner: "Marrow-Stack", name: "ms-block-forms", readmeFile: "README.md", ref: "main" },
  },

  // ── Utility ───────────────────────────────────────────────────────────────
  {
    slug: "analytics",
    name: "Analytics Tracker",
    description:
      "PostHog wrapper with auto page-view hook, user identification, a Supabase self-hosted fallback, and six pre-written SQL queries for DAU, WAU, funnel, revenue, and retention.",
    category: "utility",
    tags: ["posthog", "supabase", "typescript", "event-tracking"],
    difficulty: "intermediate",
    estimatedSetupMinutes: 4,
    status: "available",
    repo: { owner: "Marrow-Stack", name: "ms-block-analytics", readmeFile: "README.md", ref: "main" },
  },
  {
    slug: "fileupload",
    name: "File Upload",
    description:
      "Drag-and-drop file uploader — Supabase Storage with signed URLs, type and size validation, simulated progress bar, image previews, multi-file support, and a file-list component.",
    category: "utility",
    tags: ["supabase-storage", "signed-urls", "drag-drop", "react"],
    difficulty: "starter",
    estimatedSetupMinutes: 3,
    status: "available",
    repo: { owner: "Marrow-Stack", name: "ms-block-fileupload", readmeFile: "README.md", ref: "main" },
  },
  {
    slug: "search",
    name: "Full-Text Search",
    description:
      "PostgreSQL FTS via Supabase — weighted tsvector search, websearch query format, autocomplete, facet counts, highlight extraction, recent searches, and a debounced React hook with pagination.",
    category: "utility",
    tags: ["postgresql", "fts", "supabase", "react", "autocomplete"],
    difficulty: "intermediate",
    estimatedSetupMinutes: 3,
    status: "available",
    repo: { owner: "Marrow-Stack", name: "ms-block-search", readmeFile: "README.md", ref: "main" },
  },
  {
    slug: "ratelimit",
    name: "Rate Limiting",
    description:
      "Sliding-window rate limiting for Next.js 14 API routes — in-memory for dev, drop-in Upstash Redis upgrade for production, with per-IP and per-user strategies and standard headers.",
    category: "utility",
    tags: ["upstash-redis", "sliding-window", "middleware", "typescript"],
    difficulty: "starter",
    estimatedSetupMinutes: 3,
    status: "available",
    repo: { owner: "Marrow-Stack", name: "ms-block-ratelimit", readmeFile: "README.md", ref: "main" },
  },
  {
    slug: "errors",
    name: "Error Handling",
    description:
      "Structured logging, typed custom errors, a React Error Boundary, and API route wrappers — gives every thrown error a consistent shape and HTTP status code.",
    category: "utility",
    tags: ["typescript", "error-boundary", "structured-logging", "api"],
    difficulty: "starter",
    estimatedSetupMinutes: 3,
    status: "available",
    repo: { owner: "Marrow-Stack", name: "ms-block-errors", readmeFile: "README.md", ref: "main" },
  },

  // ── UI ────────────────────────────────────────────────────────────────────
  {
    slug: "darkmode",
    name: "Dark Mode",
    description:
      "Flash-free dark mode for Next.js 14+ with Tailwind — three-way light/dark/system toggle, localStorage persistence, OS preference sync, and hydration-safe rendering.",
    category: "ui",
    tags: ["tailwind", "next.js", "localStorage", "theme"],
    difficulty: "starter",
    estimatedSetupMinutes: 5,
    status: "available",
    repo: { owner: "Marrow-Stack", name: "ms-block-darkmode", readmeFile: "README.md", ref: "main" },
  },

  // ── Teasers ───────────────────────────────────────────────────────────────
  {
    slug: "solana-auth",
    name: "Solana Auth",
    description: "Sign-In-With-Solana with server-side Ed25519 verification, sessions, RBAC, and wallet–account linking.",
    category: "solana",
    tags: ["solana", "siws", "ed25519", "wallet", "rbac"],
    difficulty: "advanced",
    estimatedSetupMinutes: 15,
    status: "teaser",
    teaserNote:
      "Sign-In-With-Solana with server-side verification, sessions, RBAC, and wallet↔account linking. Open source on launch.",
  },
  {
    slug: "solana-payments",
    name: "Solana Payments",
    description: "USDC checkout on Solana with reference-keyed transfers, finalization checks, and idempotent verification.",
    category: "solana",
    tags: ["solana", "usdc", "payments", "spl-token"],
    difficulty: "advanced",
    estimatedSetupMinutes: 15,
    status: "teaser",
    teaserNote:
      "USDC checkout on Solana with reference-keyed transfers, finalization checks, and idempotent verification. Open source on launch.",
  },
];

export const BUNDLES: BundleEntry[] = [
  {
    slug: "saas-mvp",
    name: "SaaS Starter Bundle",
    description:
      "Four production-ready blocks covering authentication, billing, transactional email, and multi-tenant workspaces — everything to launch a SaaS in a weekend.",
    blockSlugs: ["auth", "billing", "email", "team"],
    repo: { owner: "Marrow-Stack", name: "ms-bundle-saas-mvp", ref: "main" },
  },
  {
    slug: "growth",
    name: "Platform Infrastructure Bundle",
    description:
      "Four blocks covering analytics tracking, real-time notifications, rate limiting, and full-text search — the infrastructure layer for a growing product.",
    blockSlugs: ["analytics", "notifications", "ratelimit", "search"],
    repo: { owner: "Marrow-Stack", name: "ms-bundle-growth", ref: "main" },
  },
];

export const CATEGORY_LABELS: Record<BlockCategory, string> = {
  auth: "Auth & Users",
  monetization: "Monetization",
  communication: "Communication",
  content: "Content",
  utility: "Utility",
  ui: "UI",
  solana: "Solana",
};

export function getBlock(slug: string): BlockEntry | undefined {
  return BLOCKS.find((b) => b.slug === slug);
}

export function getAvailableBlocks(): BlockEntry[] {
  return BLOCKS.filter((b) => b.status === "available");
}

export function getTeaserBlocks(): BlockEntry[] {
  return BLOCKS.filter((b) => b.status === "teaser");
}
