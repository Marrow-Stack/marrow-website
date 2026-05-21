# MarrowStack

Production-grade Next.js boilerplate blocks marketplace. Buyers sign in via GitHub or Solana wallet, pay with Dodo (card) or USDC/SOL, and receive a GitHub collaborator invitation to the purchased block's private repo.

---

## Quick Start (development)

```bash
git clone https://github.com/your-org/marrow-website.git
cd marrow-website
bun install
cp .env.example .env.local   # fill in values per section below
bun run dev
```

---

## Environment Setup

**Two complete, separate environments are required.** The app enforces this at boot — wrong cluster or Dodo mode = refuses to start.

| File | Use |
|------|-----|
| `.env.local` | Dev: devnet + Dodo test + test OAuth App + test GitHub org |
| `.env.production` | Prod: mainnet-beta + Dodo live + prod OAuth App + real GitHub org |

Owner checklist: see **DEPLOY-CHECKLIST.md**.

### Required vars

| Variable | Dev value | Prod value |
|----------|-----------|-----------|
| `NODE_ENV` | `development` | `production` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://marrowstack.dev` |
| `NEXT_PUBLIC_SUPABASE_URL` | dev project URL | prod project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dev anon key | prod anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | dev service key | prod service key |
| `AUTH_SECRET` | any 32+ char string | any 32+ char string |
| `AUTH_URL` | `http://localhost:3000` | `https://marrowstack.dev` |
| `GITHUB_CLIENT_ID` | dev OAuth App ID | prod OAuth App ID |
| `GITHUB_CLIENT_SECRET` | dev OAuth App secret | prod OAuth App secret |
| `GITHUB_DELIVERY_PAT` | PAT on test org | PAT on Marrow-Stack org |
| `DODO_PAYMENTS_API_KEY` | `test_…` | `live_…` |
| `DODO_PAYMENTS_WEBHOOK_SECRET` | test secret | live secret |
| `DODO_PAYMENTS_MODE` | `test` | `live` |
| `SOLANA_CLUSTER_STORE` | `devnet` | `mainnet-beta` |
| `STORE_SOLANA_RPC_URL` | devnet RPC (Helius) | mainnet RPC (Helius) |
| `STORE_SOL_TREASURY_ADDRESS` | devnet wallet pubkey | mainnet wallet pubkey |
| `STORE_USDC_MINT` | devnet USDC mint | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| `STORE_CRYPTO_DEFAULT` | `usdc` | `usdc` |
| `EMAIL_FROM` | `samarth@marrowstack.dev` | `samarth@marrowstack.dev` |
| `ADMIN_EMAILS` | your email | your email |

Per-block (add one pair per block):
```
GITHUB_REPO_AUTH=Marrow-Stack-Test/block-auth
DODO_PRODUCT_ID_AUTH=prod_xxx
```

Optional:
```
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS   # SMTP email (console fallback if not set)
UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN  # distributed rate limiting
MAINTENANCE_MODE=true                            # disables checkout, keeps marketing live
COINGECKO_API_KEY=CG-xxx                         # higher SOL price feed rate limit
```

---

## Database

Run `scripts/schema.sql` in Supabase SQL Editor once per project (dev + prod separately).
The migration is idempotent — running it twice is a no-op.

**Required tables:** `ms_users`, `ms_nonces`, `ms_orders`, `ms_deliveries`

RLS is enabled on all tables. The service role key bypasses RLS for server-side operations.
Buyers can only read their own orders and deliveries.

Enable **Point-in-Time Recovery** on the prod Supabase project before going live
(Project → Upgrade → Pro, then Settings → Backups → Enable PITR — ~$25/mo).

---

## Development commands

```bash
bun run dev              # start dev server
bun run typecheck        # TypeScript
bun run lint             # ESLint
bun run build            # production build
bun test                 # unit tests
bun run verify:static    # all static checks (no external calls)
bun run verify:dev       # full dev suite (static + interactive payment flows)
bun run verify:prod-readiness  # production readiness (no live calls)
```

---

## Payment Flows

### Dodo (card)
1. `/api/checkout/dodo` → creates order + Dodo checkout session
2. Buyer completes payment on Dodo-hosted page
3. Dodo fires `payment.succeeded` → `/api/webhooks/dodo`
4. Server verifies signature → marks order `paid` → triggers GitHub delivery

### Solana (USDC or SOL)
1. `/api/checkout/solana/quote` → creates order + 90-second quote
2. Buyer sends transfer from wallet to treasury
3. `/api/checkout/solana/verify` → validates tx at `'finalized'` commitment, ±1.5% tolerance → marks paid → delivery

### GitHub Delivery
`lib/github.ts:deliverBlock()` — adds buyer as repo collaborator. Idempotent.
If GitHub username is unknown, order stays `paid` until user provides it via
`/api/user/github-username`.

---

## API Routes

| Route | Method | Auth | Maintenance block |
|-------|--------|------|-------------------|
| `/api/checkout/dodo` | POST | Yes | Yes |
| `/api/checkout/solana/quote` | POST | Yes | Yes |
| `/api/checkout/solana/verify` | POST | Yes | No |
| `/api/webhooks/dodo` | POST | Signature | No |
| `/api/delivery/redeliver` | POST | Yes | Yes |
| `/api/auth/solana/nonce` | GET | None | No |
| `/api/user/github-username` | POST | Yes | No |
| `/api/health` | GET | None | No |

Rate limits: checkout 10/min/IP · webhook 60/min/IP · delivery 20/min/IP · nonce 30/min/IP.

---

## Security Notes

- Webhook signatures verified via `standardwebhooks` spec. Unsigned → 401, body not logged.
- All webhooks are idempotent (duplicate events are no-ops).
- Boot-time env assertions: wrong cluster or Dodo mode → server refuses to start.
- `lib/log.ts:safeLog` strips secrets from all server logs.
- Body size limits: 16KB checkout, 1MB webhooks.
- Solana verification uses `'finalized'` commitment, not `'confirmed'`.
- Rate limiting: in-process sliding window with optional Upstash Redis upgrade.

---

## Production Deploy

See **DEPLOY-CHECKLIST.md** for the full owner checklist.

**Vercel settings:**
- Framework: Next.js · Build: `bun run build` · Install: `bun install`
- Region: `iad1` (match your Supabase region — see `vercel.json`)
- Production env vars: `.env.production` values
- Preview env vars: `.env.local` values (Preview = test environment, test keys only)

**Rollback:** Vercel → Deployments → promote previous deployment.
**Soft rollback:** Set `MAINTENANCE_MODE=true` → redeploy. Marketing stays live; checkout returns 503.

---

## Refund Policy

Order status → `refunded`, but GitHub collaborator access is **not revoked**.
See DECISIONS.md for full rationale.

---

## Project Structure

```
app/api/                   API routes (see API Routes table above)
app/blocks/                Block catalog and detail pages
app/checkout/              Checkout UI and success page
app/dashboard/             Buyer dashboard
lib/
  env.ts                   Boot-time env validation + isolation guards
  log.ts                   safeLog — strips secrets from logs
  ratelimit.ts             Rate limiting (in-process + Upstash)
  api.ts                   withApi, maintenanceGuard, readBody helpers
  auth.ts                  NextAuth v5 (GitHub + SIWS)
  supabase.ts              DB client and row types
  orders.ts                Order state machine
  github.ts                GitHub delivery + username validation
  dodopayments.ts          Dodo API + webhook verification
  email.ts                 SMTP delivery emails
  price.ts                 SOL/USD price feed + quote builder
scripts/
  schema.sql               Idempotent DB migration
  verify/                  Verification scripts (verify:dev, verify:prod-readiness)
```
