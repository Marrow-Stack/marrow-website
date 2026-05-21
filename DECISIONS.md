# MarrowStack — Decision Log

Decisions are listed newest-first. Each entry answers: what, why, trade-offs considered.

---

## 2026-05-21 — Bundle pricing anchors

**Decision:** Three bundles: Growth Stack ($79, 4 blocks), Full SaaS MVP ($149, 9 blocks), Solana Launch Pack ($129, 5 blocks). Individual blocks start at $9.

**Why:** v1.1 bundle prices were ~60% below category leaders (ShipFast $199, Supastarter $349). The $149 anchor for the full stack creates a reference point that makes individual block prices look precise rather than cheap. The Solana Launch Pack is sole-source — no competitor bundles web2 auth + USDC payments.

**How to apply:** Update pricing copy to always name the $149 anchor first. Individual block pages should mention "or buy the Full SaaS MVP bundle."

---

## 2026-05-21 — USDC as default crypto rail

**Decision:** `STORE_CRYPTO_DEFAULT=usdc`. SOL is behind an env flag.

**Why:** USDC removes price volatility for both buyer and merchant. A $49 block priced in SOL at time of listing could be $30 or $70 a week later. USDC maintains the listed price exactly. SOL is available for buyers who prefer it but requires a live price feed and time-boxed quote (75s TTL recommended).

---

## 2026-05-21 — Per-block GitHub repo delivery pattern

**Decision:** Each block lives in a separate private GitHub repository. Delivery is keyed by `GITHUB_REPO_{BLOCK_ID_UPPERCASE}` env var. The PAT (`GITHUB_DELIVERY_PAT`) is shared across all repos from the same owning account.

**Why:** Buyers receive collaborator access only to the repo they purchased. A single monorepo would leak all block source to every buyer.

**Trade-offs:** More env vars to manage; mitigated by clear naming convention matching the existing `DODO_PRODUCT_ID_*` pattern.

---

## 2026-05-21 — Dodo Payments `/checkouts` endpoint + standardwebhooks

**Decision:** Use `/checkouts` on `live.dodopayments.com` (not `/v1/payment_links`). Webhook signature verified via the `standardwebhooks` npm package using `webhook-id`, `webhook-signature`, and `webhook-timestamp` headers. Event name is `payment.succeeded`.

**Why:** This matches the working implementation in the predecessor `marrow-platform` repo exactly. The previous implementation used a wrong endpoint and custom HMAC scheme that never matched Dodo's actual headers.

**Trade-offs:** Tied to Dodo's standardwebhooks spec — if they change signature schemes, the `Webhook` constructor call is the only change point.

---

## 2026-05-21 — Delivery only on server-verified webhook (never client redirect)

**Decision:** The `app/checkout/success` page displays a confirmation UI but never triggers GitHub delivery. Delivery fires exclusively from `app/api/webhooks/dodo/route.ts` after signature verification.

**Why:** Client-asserted payments (redirect URL params) can be forged. Server-side webhook is the only trusted signal.

**Trade-offs:** Slightly slower UX (GitHub invite can take a few seconds after payment), handled with a polling-ready `/checkout/success` page.

---

## 2026-05-21 — HSL-only color system

**Decision:** All CSS color values use HSL variables (`hsl(var(--token))`). No hardcoded hex or RGB anywhere in `globals.css` or component styles.

**Why:** AGENTS.md non-negotiable. HSL blends correctly with Tailwind's opacity modifier syntax and avoids subtle shade mismatches when mixing design tokens.

**Trade-offs:** Slightly more verbose CSS; pay-off is a single-token theming surface and zero accidental color drift.

---

## 2026-05-21 — Supabase service role key server-side only

**Decision:** `SUPABASE_SERVICE_ROLE_KEY` is used exclusively in server-only files (`lib/supabase.ts` `getAdminClient()`). It is never imported from any client component or `"use client"` boundary.

**Why:** Service role bypasses all RLS. Exposing it client-side would grant any user full database access.

**Trade-offs:** Requires passing data down as props rather than fetching client-side; acceptable for a server-component-first architecture.

---

## 2026-05-21 — Bun as runtime + package manager

**Decision:** All scripts use `bun` (not `npm` or `yarn`). Lock file is `bun.lock`.

**Why:** AGENTS.md specifies Bun as the primary runtime. Bun's built-in test runner (`bun test`) is used for the test suite.

**Trade-offs:** Some npm packages have minor Bun incompatibilities; none encountered so far.

---

## 2026-05-21 — 19 blocks across 6 categories

**Decision:** Blocks are categorised as: `core`, `monetization`, `utility`, `security`, `ui`, `solana`. Category is a discriminated union in `BlockCategory` type.

**Why:** Matches the taxonomy on the live marrowstack.dev site. Solana blocks get their own category (not lumped into `core`) to signal the Web3 positioning clearly.

**Trade-offs:** 6 categories increases filter UI surface; each has a distinct colour token in `CATEGORY_COLORS`.
