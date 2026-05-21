# MarrowStack v1.2 — Deploy Checklist

> Owner: complete these steps in order. Each step must be done before the next.
> The agent handles all code. You handle all credentials and infrastructure.

---

## Dev/Test Environment (do first, before any production steps)

- [ ] **1. Create a dev Supabase project** (separate from prod)
  - Go to https://supabase.com → New project
  - Project → SQL Editor → paste contents of `scripts/schema.sql` → Run
  - Settings → API → copy `Project URL`, `anon key`, `service_role key`
  - Paste into `.env.local`:
    ```
    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    SUPABASE_SERVICE_ROLE_KEY=...
    ```

- [ ] **2. Create a dev GitHub OAuth App**
  - Go to https://github.com/settings/applications/new
  - Homepage URL: `http://localhost:3000`
  - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
  - Copy Client ID and Client Secret → paste into `.env.local`:
    ```
    GITHUB_CLIENT_ID=Iv1.xxx
    GITHUB_CLIENT_SECRET=xxx
    ```

- [ ] **3. Generate AUTH_SECRET**
  - Run: `openssl rand -hex 32`
  - Paste into `.env.local`:
    ```
    AUTH_SECRET=<output>
    AUTH_URL=http://localhost:3000
    ```

- [ ] **4. Create a test GitHub org and PAT for delivery**
  - Create org `Marrow-Stack-Test` at https://github.com/organizations/new
  - Create test private repos for each block (e.g. `Marrow-Stack-Test/block-auth`)
  - Create a PAT: Settings → Developer Settings → Personal access tokens → classic → `repo` scope
  - Paste into `.env.local`:
    ```
    GITHUB_DELIVERY_PAT=ghp_xxx
    GITHUB_REPO_AUTH=Marrow-Stack-Test/block-auth
    GITHUB_REPO_SOLANA_AUTH=Marrow-Stack-Test/block-solana-auth
    GITHUB_REPO_SOLANA_PAYMENTS=Marrow-Stack-Test/block-solana-payments
    ```

- [ ] **5. Get Dodo TEST keys**
  - Log in at https://dodopayments.com → Settings → API Keys → copy test key
  - Create one Product per block in Dodo dashboard (test mode), copy product IDs
  - Register webhook: URL = `http://localhost:3000/api/webhooks/dodo` (use ngrok for local testing)
  - Paste into `.env.local`:
    ```
    DODO_PAYMENTS_API_KEY=test_xxx
    DODO_PAYMENTS_WEBHOOK_SECRET=whsec_xxx
    DODO_PAYMENTS_MODE=test
    DODO_PRODUCT_ID_AUTH=prod_xxx
    DODO_PRODUCT_ID_SOLANA_AUTH=prod_xxx
    DODO_PRODUCT_ID_SOLANA_PAYMENTS=prod_xxx
    ```

- [ ] **6. Get a devnet Solana RPC URL**
  - Sign up at https://helius.dev (free tier) → create a devnet endpoint
  - Get a devnet wallet address (Phantom → switch to devnet → copy address)
  - Paste into `.env.local`:
    ```
    SOLANA_CLUSTER_STORE=devnet
    STORE_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=xxx
    STORE_SOL_TREASURY_ADDRESS=<your_devnet_wallet_pubkey>
    STORE_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
    STORE_CRYPTO_DEFAULT=usdc
    ```

- [ ] **7. Fill remaining .env.local values**
  ```
  NODE_ENV=development
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  EMAIL_FROM=samarth@marrowstack.dev
  ADMIN_EMAILS=samarth@marrowstack.dev
  ```

- [ ] **8. Run static verification**
  ```bash
  bun install
  bun run verify:static
  ```
  All checks must be green before continuing.

- [ ] **9. Start dev server and run dev verification flows**
  ```bash
  bun run dev    # in one terminal
  bun run verify:dodo     # in another — follow on-screen prompts
  bun run verify:solana   # follow on-screen prompts
  ```
  Complete all flows. Review `verification-report.md` for results.

---

## Production Environment

> Only start these steps after ALL dev checks are green.

- [ ] **10. Create a PROD Supabase project** (separate from dev)
  - New project at https://supabase.com
  - SQL Editor → paste `scripts/schema.sql` → Run
  - **Enable Point-in-Time Recovery** (Project → Upgrade → Pro plan, then Settings → Backups → Enable PITR)
    > This is required before going live. PITR costs ~$25/mo and is your safety net.
  - Paste connection details into `.env.production`:
    ```
    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    SUPABASE_SERVICE_ROLE_KEY=...
    ```

- [ ] **11. Create a PROD GitHub OAuth App**
  - Homepage URL: `https://marrowstack.dev`
  - Callback URL: `https://marrowstack.dev/api/auth/callback/github`
  - Paste into `.env.production`:
    ```
    GITHUB_CLIENT_ID=Iv1.xxx
    GITHUB_CLIENT_SECRET=xxx
    AUTH_URL=https://marrowstack.dev
    ```

- [ ] **12. Create PROD GitHub org and PAT for delivery**
  - Ensure `Marrow-Stack` org exists with private block repos
  - Create a PAT with `repo` scope on the org owner account
  - Paste into `.env.production`:
    ```
    GITHUB_DELIVERY_PAT=ghp_xxx
    GITHUB_REPO_AUTH=Marrow-Stack/block-auth
    GITHUB_REPO_SOLANA_AUTH=Marrow-Stack/block-solana-auth
    GITHUB_REPO_SOLANA_PAYMENTS=Marrow-Stack/block-solana-payments
    ```

- [ ] **13. Get Dodo LIVE keys**
  - Dodo dashboard → Settings → API Keys → copy LIVE key
  - Create Products in Dodo (live mode), copy product IDs
  - Register webhook URL: `https://marrowstack.dev/api/webhooks/dodo`
  - Copy the webhook signing secret
  - Paste into `.env.production`:
    ```
    DODO_PAYMENTS_API_KEY=live_xxx
    DODO_PAYMENTS_WEBHOOK_SECRET=whsec_xxx
    DODO_PAYMENTS_MODE=live
    DODO_PRODUCT_ID_AUTH=prod_xxx
    DODO_PRODUCT_ID_SOLANA_AUTH=prod_xxx
    DODO_PRODUCT_ID_SOLANA_PAYMENTS=prod_xxx
    ```

- [ ] **14. Get a mainnet Solana RPC URL**
  - Helius mainnet endpoint (https://helius.dev → create mainnet endpoint)
  - Your Phantom **mainnet** wallet public key (not devnet!)
  - Mainnet USDC mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
  - Paste into `.env.production`:
    ```
    SOLANA_CLUSTER_STORE=mainnet-beta
    STORE_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=xxx
    STORE_SOL_TREASURY_ADDRESS=<your_phantom_MAINNET_pubkey>
    STORE_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
    STORE_CRYPTO_DEFAULT=usdc
    ```

- [ ] **15. Fill remaining .env.production values**
  ```
  NODE_ENV=production
  NEXT_PUBLIC_APP_URL=https://marrowstack.dev
  AUTH_SECRET=<same-or-new-32-byte-secret>
  EMAIL_FROM=samarth@marrowstack.dev
  ADMIN_EMAILS=samarth@marrowstack.dev
  ```

- [ ] **16. Run prod-readiness checks**
  ```bash
  bun run verify:prod-readiness
  ```
  All checks must be green before continuing.

---

## Vercel Setup & Deploy

- [ ] **17. Verify DNS for marrowstack.dev points to Vercel**
  - Vercel project → Settings → Domains → confirm `marrowstack.dev` is active

- [ ] **18. Configure Vercel environment variables**
  - Vercel dashboard → Project → Settings → Environment Variables
  - **Production scope:** paste all values from `.env.production`
  - **Preview scope:** paste all values from `.env.local` (test keys — Preview = test environment)
  - Double-check `DODO_PAYMENTS_MODE`, `SOLANA_CLUSTER_STORE` values for each scope

- [ ] **19. Push release branch and verify Preview deploy**
  ```bash
  git checkout -b release/v1.2.0
  git push origin release/v1.2.0
  ```
  - Wait for Vercel Preview deploy to complete
  - Open the Preview URL and manually smoke-test:
    - Sign in via GitHub
    - Buy a block with Dodo test card (`4242 4242 4242 4242`)
    - Verify GitHub invite sent, email sent, dashboard shows delivery
    - Sign in via SIWS wallet, buy with devnet USDC, verify delivery

- [ ] **20. Merge to main (production deploy)**
  ```bash
  git checkout main
  git merge release/v1.2.0
  git push origin main
  ```
  Vercel auto-deploys to production with production env vars.

---

## Post-Deploy Verification

- [ ] **21. Verify /api/health returns production**
  ```bash
  curl https://marrowstack.dev/api/health
  # Expected: {"ok":true,"env":"production",...}
  ```

- [ ] **22. Verify sitemap, robots, OG**
  ```bash
  curl -I https://marrowstack.dev/sitemap.xml    # 200
  curl -I https://marrowstack.dev/robots.txt     # 200
  curl -I https://marrowstack.dev/api/og         # 200 image/png
  ```

- [ ] **23. Sentinel checkout check (no real payment)**
  ```bash
  curl -X POST https://marrowstack.dev/api/checkout/dodo \
    -H "Content-Type: application/json" \
    -d '{"blockId":"invalid"}'
  # Expected: 4xx (not 5xx) — proves prod env loaded without throwing
  ```

- [ ] **24. Controlled $1 real-money smoke test**
  - Create a hidden `smoke-test` block ($1.00, not listed in /blocks)
  - Make one real card purchase with your personal card
  - Make one real USDC mainnet transfer (smallest viable amount)
  - Verify: webhook fires, order marked paid, no delivery fires (smoke-test block has no real repo)
  - Delete the smoke-test block from the codebase
  - Document this test in DECISIONS.md

- [ ] **25. Announce** 🎉

---

## Rollback (if needed)

**Instant rollback:** Vercel dashboard → Deployments → click the previous deployment → "Promote to Production"

**Soft rollback (payments only):** Set `MAINTENANCE_MODE=true` in Vercel → Production env vars → Redeploy.
Marketing, docs, and changelog stay live. Checkout returns 503.

---

> See README.md for detailed environment setup and architecture docs.
> See DECISIONS.md for all architectural choices and their rationale.
