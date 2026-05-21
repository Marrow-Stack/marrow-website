import NextAuth, { type DefaultSession } from "next-auth"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import nacl from "tweetnacl"
import bs58 from "bs58"
import { getAdminClient } from "./supabase"
import { type DbUser } from "./supabase"

// ─── Type augmentation ────────────────────────────────────────────────────────

declare module "next-auth" {
  interface User {
    walletAddress?: string | null
    githubLogin?: string | null
    dbId?: string | null
  }
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      walletAddress?: string | null
      githubLogin?: string | null
    } & DefaultSession["user"]
  }
}

// ─── Supabase user helpers ────────────────────────────────────────────────────

async function upsertGithubUser(params: {
  githubId: string
  githubLogin: string
  email: string | null
  name: string | null
}): Promise<DbUser> {
  const db = getAdminClient()
  const { data, error } = await db
    .from("ms_users")
    .upsert(
      {
        github_id: params.githubId,
        github_login: params.githubLogin,
        email: params.email,
        name: params.name,
      },
      { onConflict: "github_id" }
    )
    .select()
    .single()

  if (error) throw new Error(`upsertGithubUser: ${error.message}`)
  return data as DbUser
}

async function upsertWalletUser(wallet: string): Promise<DbUser> {
  const db = getAdminClient()
  const { data, error } = await db
    .from("ms_users")
    .upsert(
      { wallet_address: wallet },
      { onConflict: "wallet_address" }
    )
    .select()
    .single()

  if (error) throw new Error(`upsertWalletUser: ${error.message}`)
  return data as DbUser
}

// ─── SIWS signature verification ─────────────────────────────────────────────

function verifySolanaSignature(
  message: string,
  signatureB58: string,
  publicKeyB58: string
): boolean {
  try {
    const msgBytes = new TextEncoder().encode(message)
    const sigBytes = bs58.decode(signatureB58)
    const pkBytes  = bs58.decode(publicKeyB58)
    return nacl.sign.detached.verify(msgBytes, sigBytes, pkBytes)
  } catch {
    return false
  }
}

// ─── Nonce management (via Supabase) ─────────────────────────────────────────

const NONCE_TTL_MS = 5 * 60 * 1000 // 5 minutes

async function consumeNonce(nonce: string, wallet: string): Promise<boolean> {
  const db = getAdminClient()

  // Atomically fetch + mark consumed
  const { data } = await db
    .from("ms_nonces")
    .select()
    .eq("nonce", nonce)
    .eq("wallet", wallet)
    .is("consumed_at", null)
    .gte("created_at", new Date(Date.now() - NONCE_TTL_MS).toISOString())
    .single()

  if (!data) return false // not found, already consumed, or expired

  const { error } = await db
    .from("ms_nonces")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", (data as { id: string }).id)
    .is("consumed_at", null) // double-check still unconsumed

  return !error
}

// ─── NextAuth config ──────────────────────────────────────────────────────────

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,

  providers: [
    GitHub({
      clientId:     process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),

    Credentials({
      id:   "solana-wallet",
      name: "Solana Wallet",
      credentials: {
        wallet:    { label: "Wallet Address", type: "text" },
        nonce:     { label: "Nonce",          type: "text" },
        message:   { label: "SIWS Message",   type: "text" },
        signature: { label: "Signature",      type: "text" },
      },
      async authorize(credentials) {
        const wallet    = String(credentials?.wallet    ?? "").trim()
        const nonce     = String(credentials?.nonce     ?? "").trim()
        const message   = String(credentials?.message   ?? "").trim()
        const signature = String(credentials?.signature ?? "").trim()

        if (!wallet || !nonce || !message || !signature) return null

        // 1. Verify Ed25519 signature
        if (!verifySolanaSignature(message, signature, wallet)) return null

        // 2. Consume nonce (idempotency + replay protection)
        const consumed = await consumeNonce(nonce, wallet)
        if (!consumed) return null

        // 3. Upsert user
        const user = await upsertWalletUser(wallet)

        return {
          id:            user.id,
          name:          user.name,
          email:         user.email,
          walletAddress: wallet,
          dbId:          user.id,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Runs on sign-in (user is defined) and on every session read
      if (account?.provider === "github" && user) {
        const ghProfile = profile as { login?: string; id?: number } | undefined
        const dbUser = await upsertGithubUser({
          githubId:    String(ghProfile?.id ?? ""),
          githubLogin: ghProfile?.login ?? "",
          email:       user.email ?? null,
          name:        user.name ?? null,
        })
        token.dbId       = dbUser.id
        token.githubLogin = ghProfile?.login ?? null
        token.walletAddress = null
      }
      if (account?.provider === "solana-wallet" && user) {
        token.dbId        = user.dbId ?? user.id
        token.walletAddress = (user as { walletAddress?: string }).walletAddress ?? null
        token.githubLogin   = null
      }
      return token
    },

    async session({ session, token }) {
      session.user.id            = token.dbId as string ?? token.sub ?? ""
      session.user.githubLogin   = token.githubLogin as string | null
      session.user.walletAddress = token.walletAddress as string | null
      return session
    },
  },

  pages: {
    signIn: "/auth/signin",
  },

  session: { strategy: "jwt" },
})
