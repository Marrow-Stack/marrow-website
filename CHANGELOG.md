# Changelog

All notable changes to MarrowStack. Format: semver, ISO dates, `Added / Changed / Fixed / Security` groups.

---

## [1.2.0] — 2026-05-21

### Added
- Solana Auth (SIWS) block — Sign-In-With-Solana with Ed25519 server-side verification, single-use nonces, domain binding, clock-skew validation, and wallet↔email account linking. MIT licensed, open-sourceable as-is.
- Solana Payments (USDC) block — Reference-keyed USDC payments with 6-point on-chain verification, idempotency guard, Solana Pay URL output, subscription scaffold, and optional x402 pay-per-request middleware. MIT licensed.
- 14 new web2 blocks: Billing & Subscriptions, PayPal Checkout, Email System, User Profile, Notifications, Full-Text Search, File Upload, Analytics Tracker, SEO Toolkit, Internationalization, Rate Limiting, Error Handling, Dark Mode Toggle, Form Validation.
- Dodo Payments integration: `POST /api/checkout/dodo` creates a checkout session; `POST /api/webhooks/dodo` verifies signature (standardwebhooks) and fires GitHub delivery.
- GitHub collaborator delivery: per-block private repo pattern (`GITHUB_REPO_{BLOCK_ID}`), idempotent, retryable.
- Buyer dashboard: order history, delivery status, re-deliver action.
- Dynamic OG images via `/api/og` (1200×630, metallic dark palette).
- Sitemap covering all 19 block routes + docs pages + static routes.
- `app/robots.ts`: disallows `/api/`, `/dashboard/`, `/auth/`, `/checkout/`, `/admin/`.
- `lib/env.ts`: Zod-validated environment variables; throws at boot in production when required vars are missing.
- CI workflow (`.github/workflows/ci.yml`): typecheck + lint + build on PRs via Bun.
- Unit tests: order state machine (13 assertions) + SIWS Ed25519 verifier (5 assertions) via `bun test`.
- `DECISIONS.md`: records architectural choices with rationale.
- About page (`/about`) and Affiliate page (`/affiliate`).
- `components/marrow/TactileButton.tsx`: canonical CTA with spring physics (stiffness: 500, damping: 15), 3px Y-axis tactile press.
- `components/marrow/MetalCard.tsx`: metallic card primitive with spring-physics hover lift.
- `components/marrow/motion.ts`: single source of truth for spring constants.

### Changed
- Design system HSL-only: removed all hardcoded hex/RGB from `globals.css`. All color values now use `hsl(var(--token))` syntax.
- PricingSection updated to show three bundles: Growth Stack ($79), Full SaaS MVP ($149), Solana Launch Pack ($129).
- Block detail pages: added JSON-LD `SoftwareApplication` + `Offer`, 14-day refund risk reversal near CTA, related-block recommendations (same-category first).
- Footer: added About, Affiliate, company email (`samarth@marrowstack.dev`).
- Blocks index: category filter now includes all 6 categories (core, monetization, utility, security, ui, solana).
- Twitter card upgraded to `summary_large_image` site-wide.

### Fixed
- Dodo Payments endpoint was pointing to wrong URL (`/v1/payment_links`); corrected to `/checkouts` on `live.dodopayments.com`.
- Webhook verification was using a custom HMAC scheme; replaced with standardwebhooks library matching Dodo's actual headers.
- Event name was `payment.completed`; corrected to `payment.succeeded`.
- `DODO_PAYMENTS_MODE` env var had duplicated key in its value; corrected.
- Sitemap had duplicate `changelog` entry; removed.

---

## [1.1.0] — 2025-05-19

### Added
- 5-block initial launch: Auth System, Admin Dashboard, Team Workspace, Solana Auth, Solana Payments.
- Interactive block previews with tabbed code/playground UI.
- Metallic design system: HSL token system, dark/light theme, spring-physics interactions.
- Next.js 16 App Router with React 19, Tailwind 4, Framer Motion, Bun runtime.
- NextAuth v5 with GitHub OAuth and Solana Wallet Credentials provider.
- Supabase backend: `ms_orders`, `ms_users`, `ms_nonces`, `ms_deliveries` tables.
- Per-route purchase gating: block detail pages show locked/unlocked code based on server-side session + DB check.

---

## [1.0.0] — 2025-03-01

### Added
- Initial platform launch (`marrow-platform` — predecessor codebase, now retired).
- Auth block with email/password, GitHub OAuth, rate limiting.
- PayPal payment integration.
- Basic GitHub delivery via PAT.
