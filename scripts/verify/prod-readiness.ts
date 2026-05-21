#!/usr/bin/env bun
// Production readiness static checks.
// Does NOT call live mainnet or Dodo — verifies env file shape and key presence only.
// Run: bun run verify:prod-readiness

import fs from "fs"
import path from "path"
import { section, pass, fail, info, appendReport, initReport } from "./report"

const ROOT = path.join(import.meta.dirname, "../..")

type Results = { label: string; ok: boolean; detail?: string }[]
const RESULTS: Results = []

function check(label: string, fn: () => void) {
  try {
    fn()
    RESULTS.push({ label, ok: true })
    pass(label)
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    RESULTS.push({ label, ok: false, detail })
    fail(label, detail.split("\n")[0])
  }
}

const REQUIRED_PROD_KEYS = [
  "NODE_ENV",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "AUTH_SECRET",
  "AUTH_URL",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITHUB_DELIVERY_PAT",
  "DODO_PAYMENTS_API_KEY",
  "DODO_PAYMENTS_WEBHOOK_SECRET",
  "DODO_PAYMENTS_MODE",
  "SOLANA_CLUSTER_STORE",
  "STORE_SOLANA_RPC_URL",
  "STORE_SOL_TREASURY_ADDRESS",
  "STORE_USDC_MINT",
  "STORE_CRYPTO_DEFAULT",
  "EMAIL_FROM",
  "ADMIN_EMAILS",
]

function parseDotenv(content: string): Record<string, string> {
  const env: Record<string, string> = {}
  for (const line of content.split("\n")) {
    const stripped = line.trim()
    if (!stripped || stripped.startsWith("#")) continue
    const eqIdx = stripped.indexOf("=")
    if (eqIdx < 0) continue
    const key = stripped.slice(0, eqIdx).trim()
    const val = stripped.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "")
    env[key] = val
  }
  return env
}

section("Production Readiness Checks")

// 1. .env.production exists
check(".env.production file exists", () => {
  const p = path.join(ROOT, ".env.production")
  if (!fs.existsSync(p)) {
    throw new Error(
      ".env.production not found. Create it from .env.example and fill in production values."
    )
  }
})

// 2. All required keys present and non-empty
check("All required env keys present in .env.production", () => {
  const p = path.join(ROOT, ".env.production")
  if (!fs.existsSync(p)) throw new Error(".env.production not found")

  const env = parseDotenv(fs.readFileSync(p, "utf8"))
  const missing = REQUIRED_PROD_KEYS.filter((k) => !env[k] || env[k].trim() === "")
  if (missing.length > 0) {
    throw new Error(`Missing or empty keys: ${missing.join(", ")}`)
  }
})

// 3. Production values pass guards
check("Production env values are correct", () => {
  const p = path.join(ROOT, ".env.production")
  if (!fs.existsSync(p)) throw new Error(".env.production not found")

  const env = parseDotenv(fs.readFileSync(p, "utf8"))
  const errors: string[] = []

  if (env.SOLANA_CLUSTER_STORE !== "mainnet-beta")
    errors.push("SOLANA_CLUSTER_STORE must be 'mainnet-beta'")
  if (env.DODO_PAYMENTS_MODE !== "live")
    errors.push("DODO_PAYMENTS_MODE must be 'live'")
  if (!env.AUTH_URL?.startsWith("https://"))
    errors.push("AUTH_URL must start with https://")
  if (!env.NEXT_PUBLIC_APP_URL?.startsWith("https://"))
    errors.push("NEXT_PUBLIC_APP_URL must start with https://")
  if (env.NODE_ENV !== "production")
    errors.push("NODE_ENV must be 'production'")
  if (!env.DODO_PAYMENTS_API_KEY?.startsWith("live_") && !env.DODO_PAYMENTS_API_KEY?.startsWith("sk_"))
    info("Warning: DODO_PAYMENTS_API_KEY doesn't look like a live key (expected 'live_' or 'sk_' prefix)")

  if (errors.length > 0) throw new Error(errors.join("; "))
})

// 4. No devnet Solana cluster URL in production
check("Production RPC URL is not a devnet URL", () => {
  const p = path.join(ROOT, ".env.production")
  if (!fs.existsSync(p)) return

  const env = parseDotenv(fs.readFileSync(p, "utf8"))
  const rpc = env.STORE_SOLANA_RPC_URL ?? ""
  if (rpc.includes("devnet")) {
    throw new Error(`STORE_SOLANA_RPC_URL contains 'devnet' — production must use mainnet-beta RPC`)
  }
})

// 5. Auth URL matches expected production domain
check("AUTH_URL matches NEXT_PUBLIC_APP_URL in .env.production", () => {
  const p = path.join(ROOT, ".env.production")
  if (!fs.existsSync(p)) return

  const env = parseDotenv(fs.readFileSync(p, "utf8"))
  const authUrl = env.AUTH_URL ?? ""
  const appUrl  = env.NEXT_PUBLIC_APP_URL ?? ""
  if (authUrl && appUrl && authUrl !== appUrl) {
    throw new Error(`AUTH_URL=${authUrl} differs from NEXT_PUBLIC_APP_URL=${appUrl}`)
  }
})

// 6. schema.sql tables exist (structural check)
check("schema.sql has required tables (structural)", () => {
  const schemaPath = path.join(ROOT, "scripts/schema.sql")
  if (!fs.existsSync(schemaPath)) throw new Error("scripts/schema.sql not found")

  const schema = fs.readFileSync(schemaPath, "utf8")
  const required = ["ms_users", "ms_nonces", "ms_orders", "ms_deliveries"]
  const missing = required.filter((t) => !schema.includes(t))
  if (missing.length > 0) {
    throw new Error(`Missing tables in schema: ${missing.join(", ")}`)
  }
})

// 7. Verify vercel.json exists (if using Vercel)
check("vercel.json present", () => {
  const p = path.join(ROOT, "vercel.json")
  if (!fs.existsSync(p)) {
    throw new Error("vercel.json not found — create it with region config (see README)")
  }
})

// 8. .env.production is in .gitignore
check(".env.production is gitignored", () => {
  const gitignorePath = path.join(ROOT, ".gitignore")
  if (!fs.existsSync(gitignorePath)) {
    throw new Error(".gitignore not found")
  }
  const gitignore = fs.readFileSync(gitignorePath, "utf8")
  if (!gitignore.includes(".env.production") && !gitignore.includes(".env*.local") && !gitignore.includes(".env*")) {
    throw new Error(".env.production is NOT in .gitignore — secrets would be committed!")
  }
})

// ─── Summary ──────────────────────────────────────────────────────────────────

const passed = RESULTS.filter((r) => r.ok).length
const failed = RESULTS.filter((r) => !r.ok)

console.log(`\n${"─".repeat(50)}`)
console.log(`Prod readiness: ${passed}/${RESULTS.length} passed`)

initReport()
appendReport("Production Readiness", RESULTS.map((r) => {
  const status = r.ok ? "PASS" : "FAIL"
  return `${status}: ${r.label}${r.detail ? ` — ${r.detail.split("\n")[0]}` : ""}`
}))

if (failed.length > 0) {
  console.error(`\n${failed.length} check(s) failed:`)
  failed.forEach((r) => console.error(`  ✗ ${r.label}: ${r.detail?.split("\n")[0] ?? ""}`))
  console.error("\nFix all failures before deploying to production.")
  process.exit(1)
} else {
  console.log("\n✅ All prod-readiness checks passed. Proceed with caution.")
}
