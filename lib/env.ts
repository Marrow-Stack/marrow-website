import { z } from "zod"

// Known devnet/test addresses that must never appear as the production treasury
const DEVNET_TREASURY_DENYLIST = new Set([
  "So11111111111111111111111111111111111111112",    // WSOL mint
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // common devnet faucet wallet
  "FriELggez2Dy3phZeHHAdpcoEksKAqkfCDiskZYzQLe",  // devnet test wallet
  "CpMah17kQEL2wqyMKt3mZBdTnZbkbfx4nqmQMFDP5vwk", // common test recipient
  "11111111111111111111111111111111",               // system program
])

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.url(),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // NextAuth v5
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be ≥ 32 chars"),
  AUTH_URL: z.url(),

  // GitHub OAuth
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),

  // GitHub delivery
  GITHUB_DELIVERY_PAT: z.string().min(1),

  // Dodo Payments
  DODO_PAYMENTS_API_KEY: z.string().min(1),
  DODO_PAYMENTS_WEBHOOK_SECRET: z.string().min(1),
  DODO_PAYMENTS_MODE: z.enum(["live", "test"]),

  // Solana store
  SOLANA_CLUSTER_STORE: z.enum(["mainnet-beta", "devnet", "testnet"]),
  STORE_SOLANA_RPC_URL: z.url(),
  STORE_SOL_TREASURY_ADDRESS: z.string().min(32).max(50),
  STORE_USDC_MINT: z.string().min(32).max(50),
  STORE_CRYPTO_DEFAULT: z.enum(["sol", "usdc"]).default("usdc"),

  // Email
  EMAIL_FROM: z.email(),

  // Admin
  ADMIN_EMAILS: z.string().min(1),
})

type ParsedEnv = z.infer<typeof envSchema>

function assertProductionGuards(env: ParsedEnv): string[] {
  const errors: string[] = []

  if (env.SOLANA_CLUSTER_STORE !== "mainnet-beta")
    errors.push("SOLANA_CLUSTER_STORE must be 'mainnet-beta' in production")

  if (env.DODO_PAYMENTS_MODE !== "live")
    errors.push("DODO_PAYMENTS_MODE must be 'live' in production")

  if (!env.AUTH_URL.startsWith("https://"))
    errors.push("AUTH_URL must start with https:// in production")

  if (!env.NEXT_PUBLIC_APP_URL.startsWith("https://"))
    errors.push("NEXT_PUBLIC_APP_URL must start with https:// in production")

  if (DEVNET_TREASURY_DENYLIST.has(env.STORE_SOL_TREASURY_ADDRESS))
    errors.push(
      `STORE_SOL_TREASURY_ADDRESS (${env.STORE_SOL_TREASURY_ADDRESS}) is a known devnet/test address — use your real mainnet wallet`
    )

  return errors
}

function assertDevGuards(env: ParsedEnv): string[] {
  const errors: string[] = []

  if (env.SOLANA_CLUSTER_STORE === "mainnet-beta")
    errors.push(
      "SOLANA_CLUSTER_STORE=mainnet-beta in a non-production env would execute real on-chain transactions. Refusing to start."
    )

  if (env.DODO_PAYMENTS_MODE === "live")
    errors.push(
      "DODO_PAYMENTS_MODE=live in a non-production env would process real payments. Refusing to start."
    )

  return errors
}

function validateEnv(): ParsedEnv | null {
  if (typeof process === "undefined") return null

  const isTest = process.env.NODE_ENV === "test"
  const isProd = process.env.NODE_ENV === "production"

  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n")
    const msg = `[env] Missing or invalid environment variables:\n${missing}`

    if (isProd) throw new Error(msg)
    if (!isTest) console.warn(msg)
    return null
  }

  const env = result.data

  if (isProd) {
    const errors = assertProductionGuards(env)
    if (errors.length > 0) {
      throw new Error(
        `[env] Production environment misconfiguration — refusing to start:\n` +
          errors.map((e) => `  ✗ ${e}`).join("\n")
      )
    }
  } else {
    const errors = assertDevGuards(env)
    if (errors.length > 0) {
      throw new Error(
        `[env] Dev/test env has production credentials — refusing to start:\n` +
          errors.map((e) => `  ✗ ${e}`).join("\n")
      )
    }
  }

  if (!isTest) {
    const keys = Object.keys(env)
      .filter((k) => env[k as keyof ParsedEnv] !== undefined && env[k as keyof ParsedEnv] !== "")
      .sort()
    console.log(`[env] Loaded (${env.NODE_ENV}) — keys: ${keys.join(", ")}`)
  }

  return env
}

// Validated at module load. Throws immediately on production misconfig.
const _env = validateEnv()

export { _env as env }
export {}
