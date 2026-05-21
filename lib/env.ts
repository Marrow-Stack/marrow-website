import { z } from "zod"

const envSchema = z.object({
  // NextAuth
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 chars"),
  AUTH_URL: z.string().url(),

  // GitHub OAuth
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_DELIVERY_PAT: z.string().min(1),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Dodo Payments
  DODO_PAYMENTS_API_KEY: z.string().min(1),
  DODO_PAYMENTS_WEBHOOK_SECRET: z.string().min(1),
  DODO_PAYMENTS_MODE: z.enum(["live", "test"]).default("live"),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Admin
  ADMIN_EMAILS: z.string().min(1),
})

// Only validate in Node.js runtime (not edge), and only in production
// to avoid blocking local dev with missing optional vars
function validateEnv() {
  if (typeof process === "undefined") return

  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n")
    const msg = `[env] Missing or invalid environment variables:\n${missing}`
    if (process.env.NODE_ENV === "production") {
      throw new Error(msg)
    } else {
      console.warn(msg)
    }
  }
}

validateEnv()

export {}
