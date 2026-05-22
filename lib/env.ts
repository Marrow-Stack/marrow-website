import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.url(),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // NextAuth
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be ≥ 32 chars"),
  AUTH_URL: z.url(),

  // GitHub OAuth
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),

  // GitHub read-only PAT (public repos, 5000 req/hr vs 60/hr anonymous)
  GITHUB_TOKEN: z.string().min(1).optional(),

  // Transactional email (Resend)
  RESEND_API_KEY: z.string().min(1).optional(),
  SUPPORT_EMAIL: z.email().optional(),

  // Owner attribution
  NEXT_PUBLIC_OWNER_GITHUB_URL: z.url().optional(),

  // Privacy: HMAC key for IP hashing
  IP_HASH_SECRET: z.string().min(16).optional(),

  // Admin
  ADMIN_REVALIDATE_TOKEN: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
})

type ParsedEnv = z.infer<typeof envSchema>

const REQUIRED_IN_PROD: Array<keyof ParsedEnv> = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "AUTH_SECRET",
  "AUTH_URL",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITHUB_TOKEN",
  "IP_HASH_SECRET",
]

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
    const missing = REQUIRED_IN_PROD.filter((k) => !env[k])
    if (missing.length > 0) {
      throw new Error(
        `[env] Production is missing required keys: ${missing.join(", ")}`
      )
    }

    if (!env.GITHUB_TOKEN) {
      console.warn("[env] GITHUB_TOKEN is not set — GitHub API rate limit is 60 req/hr per IP")
    }

    if (!env.AUTH_URL?.startsWith("https://")) {
      throw new Error("[env] AUTH_URL must start with https:// in production")
    }
  }

  if (!isTest) {
    const keys = Object.keys(env)
      .filter((k) => env[k as keyof ParsedEnv] !== undefined)
      .sort()
    console.log(`[env] Loaded (${env.NODE_ENV}) — ${keys.length} keys`)
  }

  return env
}

const _env = validateEnv()

export { _env as env }
export {}
