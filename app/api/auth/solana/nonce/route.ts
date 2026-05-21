import { NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase"
import crypto from "crypto"

// Generates a single-use SIWS nonce for the given wallet address.
// Called by the frontend before prompting the wallet to sign.
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet")?.trim()
  if (!wallet) {
    return NextResponse.json({ error: "wallet param required" }, { status: 400 })
  }

  // Basic base58 length check (Solana pubkeys are 32 bytes = 44 base58 chars)
  if (wallet.length < 32 || wallet.length > 50) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 })
  }

  const nonce = crypto.randomBytes(16).toString("hex")
  const domain = new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://marrowstack.dev"
  ).hostname

  const db = getAdminClient()
  const { error } = await db.from("ms_nonces").insert({ nonce, wallet, domain })
  if (error) {
    return NextResponse.json({ error: "Failed to create nonce" }, { status: 500 })
  }

  return NextResponse.json({ nonce, domain })
}
