# MarrowStack — Decision Log

Decisions are listed newest-first. Each entry answers: what, why, trade-offs considered.

---

## 2026-05-21 — Refund policy: access retained after refund

**Decision:** When a Dodo `refund.succeeded` webhook is received, the order status is set to `refunded` in the DB but the buyer's GitHub collaborator access to the delivery repo is **not revoked**.

**Why:** Code is not a physical good — once cloned, it cannot be "un-cloned." Revoking access after refund creates friction, does not recover the asset, and creates a support burden. The policy is: refund issued = money returned, code stays accessible. This is the same policy used by Gumroad, Paddle, and most digital goods platforms.

**Trade-offs:** A malicious buyer could clone the repo, request a refund, and keep the code. Mitigated by: (1) blocks are $9–$149, not $thousands, (2) the buyer had already accepted the GitHub invite and had access from the moment of delivery, (3) enforcement at delivery-repo level (individual file watermarking) is the long-term answer if needed.

**How to apply:** If the owner later changes this policy (e.g. revoke access on refund), update `app/api/webhooks/dodo/route.ts` in the `refund.succeeded` handler and document the change here.

---

## 2026-05-21 — Redelivery row semantics

**Decision:** Every call to `deliverBlock()` creates a new row in `ms_deliveries` with its own `attempted_at` timestamp. Redelivery does not update the original row; it appends a new one. The dashboard shows the most recent delivery record.

**Why:** Append-only audit trail. If a delivery fails and succeeds on retry, both attempts are recorded. "Redelivery" button email is sent only if the new delivery attempt actually granted new access (GitHub returns 201, not 204).

**Trade-offs:** The `ms_deliveries` table grows unboundedly for frequent redeliveries. Mitigated by a cron cleanup (delete delivery rows older than 6 months for delivered orders, if needed in future).

---

## 2026-05-21 — SOL quote tolerance band: ±1.5%

**Decision:** Payment verification accepts a SOL (or USDC) amount within ±1.5% of the quoted amount. Defined as `PRICE_TOLERANCE = 0.015` in `lib/price.ts`.

**Why:** Network fees and floating-point rounding can cause the received amount to differ by a tiny fraction from the quoted amount. 1.5% is wide enough to absorb real-world variance (Solana fees are fractions of a cent) while being tight enough that a partial payment of e.g. 80% of the quoted amount is correctly rejected.

**How to apply:** If the owner reports legitimate payments being rejected (amount mismatch), widen to 2.0%. If payments slightly below the price are being accepted, tighten to 0.5%. Document any change here.

---

## 2026-05-21 — Devnet USDC source for testing

**Decision:** During devnet testing, use the Solana Labs devnet USDC faucet or the `spl-token` CLI to mint devnet USDC to the test wallet. The devnet USDC mint is `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` (Circle devnet token). Verify this address is current at https://spl.solana.com before each test run.

**Why:** Devnet USDC is free and reset-able. No real money is at risk. The devnet mint address is stable but can change with Solana network resets.

---

## 2026-05-21 — Solana RPC provider recommendation

**Decision:** Helius (https://helius.dev) is the recommended RPC provider for both devnet and mainnet-beta. Free tier supports ~10M compute units/month. For production under sustained load, the Growth plan ($49/mo) is recommended.

**Why:** Helius provides dedicated endpoints, better rate limits than the public RPC, WebSocket support (useful for tx confirmation listening), and a generous free tier for early-stage products. QuickNode and Jito are also suitable alternatives.

**Alternative:** If the owner already has a QuickNode or Jito endpoint, use that — the only requirement is that `STORE_SOLANA_RPC_URL` contains a reliable mainnet-beta RPC and that `SOLANA_CLUSTER_STORE=mainnet-beta` is set.

---

## 2026-05-21 — Two-environment enforcement at boot

**Decision:** `lib/env.ts` asserts at server startup that:
- In `NODE_ENV=production`: `SOLANA_CLUSTER_STORE=mainnet-beta`, `DODO_PAYMENTS_MODE=live`, `AUTH_URL` starts with `https://`
- In any other NODE_ENV: `SOLANA_CLUSTER_STORE≠mainnet-beta`, `DODO_PAYMENTS_MODE≠live`
A wrong-environment config throws and prevents the server from starting.

**Why:** A single cross-wired env var (devnet key used with mainnet config, or vice versa) could cause: (1) real money sent to a devnet treasury that can't receive it, (2) test payments being processed as real, (3) devnet txs marked as paid in a production DB. The structural boot check makes this class of mistake impossible to ship.

**Trade-offs:** Slightly stricter dev setup. Mitigated by `.env.example` documenting every required key with correct dev values.

---

## 2026-05-21 — Rate limiting strategy: in-process + Upstash fallback

**Decision:** Rate limiting uses Upstash Redis when `UPSTASH_REDIS_REST_URL` is set; falls back to an in-process sliding window otherwise. Production logs a one-time warning if Upstash is not configured.

**Why:** In-process limiting is sufficient for single-instance Vercel deployments and requires no additional infrastructure. Upstash is cheap ($0–$10/mo for the load we expect) and provides correct distributed limiting across concurrent Vercel instances in the same region.

**Limits:** checkout: 10/min/IP, webhook: 60/min/IP, delivery: 20/min/IP, GitHub-validate: 30/min/IP, nonce: 30/min/IP.

---

## 2026-05-21 — Finalized commitment for payment verification

**Decision:** Solana payment verification uses `'finalized'` commitment level (not `'confirmed'` or `'processed'`). A transaction is accepted as valid only when it has been finalized by a supermajority of the cluster.

**Why:** `'confirmed'` transactions can still be rolled back in rare cluster conditions. `'finalized'` means the transaction is permanently committed with no possibility of rollback. For payments, correctness > speed. The UX impact is ~30–60 seconds additional wait vs confirmed, shown to the buyer as a "finalizing..." state.

---

## 2026-05-21 — Vercel region: iad1 (us-east-1)

**Decision:** Vercel deployment is pinned to `iad1` (US East, Ashburn VA) in `vercel.json`.

**Why:** Minimizes latency to Supabase when the Supabase project is provisioned in us-east-1 (AWS us-east-1). If the owner chose a different Supabase region, update `vercel.json` accordingly. See https://vercel.com/docs/concepts/functions/regions for the full list.

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
