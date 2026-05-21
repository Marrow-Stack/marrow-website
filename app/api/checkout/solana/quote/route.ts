import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getBlock } from "@/lib/blocks-data"
import { buildQuote } from "@/lib/price"
import { createOrder, setOrderAwaitingPayment } from "@/lib/orders"
import { safeLog } from "@/lib/log"
import { limits, getIp } from "@/lib/ratelimit"
import { maintenanceGuard, rateLimitExceeded, readBody } from "@/lib/api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function assertMainnet() {
  const cluster = process.env.SOLANA_CLUSTER_STORE
  if (cluster !== "mainnet-beta") {
    throw new Error(
      `SOLANA_CLUSTER_STORE=${cluster} — the store must use mainnet-beta. Refusing to create a payment quote.`
    )
  }
  const rpc = process.env.STORE_SOLANA_RPC_URL ?? ""
  if (!rpc) throw new Error("STORE_SOLANA_RPC_URL not set")
}

export async function POST(req: NextRequest) {
  const maintenance = maintenanceGuard()
  if (maintenance) return maintenance

  const ip = getIp(req)
  const rl = await limits.checkout(ip)
  if (!rl.ok) return rateLimitExceeded()

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Unauthenticated" } }, { status: 401 })
  }

  try {
    assertMainnet()
  } catch (e) {
    safeLog.error("[solana-quote]", String(e))
    return NextResponse.json({ error: { code: "CLUSTER_MISMATCH", message: String(e) } }, { status: 503 })
  }

  const body     = await readBody<{ blockId?: string; currency?: string }>(req)
  const blockId  = String(body?.blockId  ?? "").trim()
  const currency = String(body?.currency ?? process.env.STORE_CRYPTO_DEFAULT ?? "usdc").toLowerCase()

  if (!blockId) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "blockId required" } }, { status: 400 })
  if (currency !== "sol" && currency !== "usdc") {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "currency must be 'sol' or 'usdc'" } }, { status: 400 })
  }

  const block = getBlock(blockId)
  if (!block) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Block not found" } }, { status: 404 })

  const treasury = process.env.STORE_SOL_TREASURY_ADDRESS
  if (!treasury) {
    return NextResponse.json({ error: { code: "CONFIG_ERROR", message: "Treasury address not configured" } }, { status: 503 })
  }

  const quote = await buildQuote(block.price)

  const order = await createOrder({
    userId:    session.user.id,
    blockId:   block.id,
    blockName: block.name,
    amountUsd: block.price,
  })

  await setOrderAwaitingPayment(order.id, currency === "sol" ? "solana" : "usdc", {
    cryptoAmount:   currency === "sol" ? quote.solAmount : quote.usdcAmount,
    cryptoCurrency: currency === "sol" ? "SOL" : "USDC",
    quotePriceUsd:  quote.solPriceUsd,
    quoteExpiresAt: quote.quoteExpiresAt,
  })

  return NextResponse.json({
    orderId:         order.id,
    currency,
    amount:          currency === "sol" ? quote.solAmount : quote.usdcAmount,
    amountUsd:       block.price,
    solPriceUsd:     currency === "sol" ? quote.solPriceUsd : undefined,
    treasuryAddress: treasury,
    usdcMint:        currency === "usdc" ? process.env.STORE_USDC_MINT : undefined,
    quoteExpiresAt:  quote.quoteExpiresAt,
  })
}
