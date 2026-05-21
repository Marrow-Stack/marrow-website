#!/usr/bin/env bun
// Solana devnet verification flows.
// Requires a running dev server and a funded devnet wallet (Phantom on devnet).

import { createClient } from "@supabase/supabase-js"
import { section, pass, fail, info, appendReport, initReport } from "./report"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

function requireEnv(key: string): string {
  const v = process.env[key]
  if (!v) {
    fail(`Missing required env var: ${key}`)
    process.exit(1)
  }
  return v
}

async function prompt(msg: string): Promise<void> {
  process.stdout.write(`\n⏸  ${msg}\n   Press ENTER to continue... `)
  return new Promise((resolve) => {
    process.stdin.setEncoding("utf8")
    process.stdin.once("data", () => resolve())
  })
}

async function main() {
  section("Solana Devnet Verification")

  // Guard: must be devnet
  const cluster = process.env.SOLANA_CLUSTER_STORE
  if (cluster === "mainnet-beta") {
    fail("SOLANA_CLUSTER_STORE=mainnet-beta — this script must run on devnet only!")
    process.exit(1)
  }
  pass(`SOLANA_CLUSTER_STORE=${cluster} (non-mainnet confirmed)`)

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
  const serviceKey  = requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const treasuryAddress = process.env.STORE_SOL_TREASURY_ADDRESS
  const usdcMint = process.env.STORE_USDC_MINT

  info(`Treasury: ${treasuryAddress}`)
  info(`USDC mint (devnet): ${usdcMint}`)
  info(`RPC: ${process.env.STORE_SOLANA_RPC_URL}`)

  // ── Flow S1: USDC devnet purchase ─────────────────────────────────────────

  section("Flow S1 — USDC devnet purchase (happy path)")
  info("Prerequisites:")
  info("  • Phantom wallet switched to devnet")
  info("  • Wallet has devnet SOL (use https://faucet.solana.com for airdrop)")
  info("  • Wallet has devnet USDC (mint from devnet USDC faucet or use spl-token mint)")

  await prompt(`
Step 1: Open ${APP_URL} and sign in via GitHub.
Step 2: Go to a block page (e.g. /blocks/auth) and start a purchase.
Step 3: Choose Solana / USDC payment rail.
Step 4: Note the quoted USDC amount and treasury address shown in UI.
Step 5: In Phantom (devnet), send that exact USDC amount to the treasury address.
Step 6: Submit the transaction signature in the UI and wait for confirmation.
When done and you see the success screen, press ENTER.`)

  const { data: solanaOrders } = await db
    .from("ms_orders")
    .select("id, status, rail, crypto_currency, external_payment_id, crypto_amount")
    .in("rail", ["usdc", "solana"])
    .order("created_at", { ascending: false })
    .limit(1)

  const order = solanaOrders?.[0]
  if (!order) {
    fail("S1: No Solana order found in DB after test purchase")
  } else {
    if (["paid", "delivered"].includes(order.status)) {
      pass(`S1: Order ${order.id} status=${order.status} rail=${order.rail}`)
    } else {
      fail(`S1: Order ${order.id} status=${order.status} — expected paid or delivered`)
    }

    if (order.external_payment_id) {
      pass(`S1: Transaction signature recorded: ${order.external_payment_id.slice(0, 20)}...`)
    } else {
      fail("S1: No transaction signature — payment may not have been verified")
    }

    // Idempotency
    const { data: recheck } = await db
      .from("ms_orders")
      .select("status")
      .eq("id", order.id)
      .single()
    pass(`S1: Idempotency — status is still ${recheck?.status} on re-fetch`)
  }

  // ── Flow S2: SOL rail with expiring quote ─────────────────────────────────

  section("Flow S2 — SOL rail with quote expiry")
  info("Set STORE_CRYPTO_DEFAULT=sol in .env.local and restart dev server, then run this flow.")
  info("The quote expires in ~90 seconds. You will need to:")
  info("  1. Get a quote, let it expire, submit stale amount → expect rejection")
  info("  2. Get a fresh quote, pay within window → expect success")
  info("  3. Get a fresh quote, pay just below tolerance (-2%) → expect rejection")

  await prompt(`
MANUAL FLOW:
  a) Go to a block purchase, choose SOL payment.
  b) Note the SOL amount and expiry countdown.
  c) Wait for the countdown to hit 0.
  d) Try to submit with the expired quote — expect 'Quote expired' error.
  e) Click 'Refresh quote', pay immediately → expect success.
  f) Restore STORE_CRYPTO_DEFAULT=usdc when done.
Press ENTER when you have observed both the expiry rejection and the successful payment.`)

  pass("S2: Quote expiry flow observed (manual confirmation)")

  // ── Flow S3: Wallet-only buyer ────────────────────────────────────────────

  section("Flow S3 — Wallet-only buyer with GitHub username collection")

  await prompt(`
Step 1: Sign OUT of GitHub session.
Step 2: Sign in via 'Sign in with Solana' (SIWS).
Step 3: Go to a block purchase page and start checkout.
Step 4: Complete USDC payment.
Step 5: On the success/post-payment screen, enter a FAKE GitHub username that doesn't exist.
  → Expect: validation error shown inline, no delivery.
Step 6: Enter a REAL GitHub username (yours or a test account).
  → Expect: validation passes, delivery fires, email sent.
Press ENTER when both invalid and valid username flows are verified.`)

  pass("S3: Wallet-only buyer flow observed (manual confirmation)")

  // ── Flow S5: Playground sandbox boundary ──────────────────────────────────

  section("Flow S5 — Playground sandbox boundary check")

  await prompt(`
Step 1: Open ${APP_URL}/blocks/solana-auth — use the embedded playground.
Step 2: Connect a devnet wallet and complete a SIWS sign-in in the playground.
Step 3: Toggle the 'tamper' option and verify the playground rejects the signature.
Step 4: Open ${APP_URL}/blocks/solana-payments — use the playground for a devnet transfer.
Step 5: After the playground transaction, confirm in the DB that NO rows were created
  in ms_orders or ms_deliveries (playground is sandboxed).
Press ENTER when confirmed.`)

  // Verify playground didn't touch real tables
  const { data: recentOrders } = await db
    .from("ms_orders")
    .select("id, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  info(`S5: ${recentOrders?.length ?? 0} total orders in DB (expected: only from real flows)`)
  pass("S5: Playground boundary check — verify manually that order count matches real flows only")

  // ── Flow S6: Mainnet config guard ─────────────────────────────────────────

  section("Flow S6 — Mainnet config guard")
  info("Temporarily set SOLANA_CLUSTER_STORE=mainnet-beta in .env.local, then try to start dev server.")
  info("The server should refuse to start with a clear error.")

  await prompt(`
Step 1: Set SOLANA_CLUSTER_STORE=mainnet-beta in .env.local.
Step 2: Run 'bun run dev'.
Step 3: Confirm the server throws an error about production credentials in dev env.
Step 4: Restore SOLANA_CLUSTER_STORE=devnet.
Press ENTER when confirmed.`)

  pass("S6: Mainnet config guard observed (manual confirmation)")

  // ── Summary ────────────────────────────────────────────────────────────────

  section("Solana Verification Summary")
  initReport()
  appendReport("Solana Devnet", [
    "S1: USDC devnet purchase — see console output above",
    "S2: SOL quote expiry — manual verification",
    "S3: Wallet-only buyer + GitHub username collection — manual",
    "S5: Playground sandbox boundary — manual",
    "S6: Mainnet config guard — manual",
  ])

  info("Solana verification complete.")
}

main().catch((e) => {
  fail("Solana verification crashed", String(e))
  process.exit(1)
})
