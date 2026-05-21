import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getBlock } from "@/lib/blocks-data"
import { buildQuote } from "@/lib/price"
import { createOrder, setOrderAwaitingPayment } from "@/lib/orders"

// POST /api/checkout/solana/quote
// Body: { blockId: string; currency: 'sol' | 'usdc' }
// Returns: { orderId, currency, amount, solPriceUsd?, treasuryAddress, usdcMint?, quoteExpiresAt }
//
// MAINNET ONLY — never shares config with the devnet playground.
// The RPC assertion at startup (see lib/price.ts boot check) ensures this.

function assertMainnet() {
  const rpc = process.env.STORE_SOLANA_RPC_URL ?? ""
  if (!rpc) throw new Error("STORE_SOLANA_RPC_URL not set")
  if (!rpc.includes("mainnet")) {
    throw new Error(
      "STORE_SOLANA_RPC_URL does not contain 'mainnet'. " +
      "The store must use mainnet-beta. Refusing to create a payment quote."
    )
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }

  // Hard guard: mainnet only
  try {
    assertMainnet()
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 })
  }

  const body     = await req.json().catch(() => null)
  const blockId  = String(body?.blockId  ?? "").trim()
  const currency = String(body?.currency ?? process.env.STORE_CRYPTO_DEFAULT ?? "usdc").toLowerCase()

  if (!blockId) return NextResponse.json({ error: "blockId required" }, { status: 400 })
  if (currency !== "sol" && currency !== "usdc") {
    return NextResponse.json({ error: "currency must be 'sol' or 'usdc'" }, { status: 400 })
  }

  const block = getBlock(blockId)
  if (!block) return NextResponse.json({ error: "Block not found" }, { status: 404 })

  const treasury = process.env.STORE_SOL_TREASURY_ADDRESS
  if (!treasury) {
    return NextResponse.json({ error: "Treasury address not configured" }, { status: 503 })
  }

  // Build price quote
  const quote = await buildQuote(block.price)

  // Create the order
  const order = await createOrder({
    userId:    session.user.id,
    blockId:   block.id,
    blockName: block.name,
    amountUsd: block.price,
  })

  // Transition to awaiting_payment with quote data
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
