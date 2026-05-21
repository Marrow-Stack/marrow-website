import { NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase"
import { limits, getIp } from "@/lib/ratelimit"
import { rateLimitExceeded } from "@/lib/api"
import crypto from "crypto"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const ip = getIp(req)
  const rl = await limits.nonce(ip)
  if (!rl.ok) return rateLimitExceeded()

  const wallet = req.nextUrl.searchParams.get("wallet")?.trim()
  if (!wallet) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "wallet param required" } }, { status: 400 })
  }

  if (wallet.length < 32 || wallet.length > 50) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid wallet address" } }, { status: 400 })
  }

  const nonce = crypto.randomBytes(16).toString("hex")
  const domain = new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://marrowstack.dev"
  ).hostname

  const db = getAdminClient()
  const { error } = await db.from("ms_nonces").insert({ nonce, wallet, domain })
  if (error) {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create nonce" } }, { status: 500 })
  }

  return NextResponse.json({ nonce, domain })
}
