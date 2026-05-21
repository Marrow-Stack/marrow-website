import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { getOrderById, markOrderPaid } from "@/lib/orders"
import { deliverBlock, getRepoForBlock } from "@/lib/github"
import { sendDeliveryEmail } from "@/lib/email"
import { isQuoteExpired, amountWithinTolerance } from "@/lib/price"
import { getAdminClient } from "@/lib/supabase"

// USDC token program and mint
const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"

// POST /api/checkout/solana/verify
// Body: { orderId: string; txSignature: string }
// Verifies the Solana mainnet transaction against the order's quoted amount.

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }

  const body        = await req.json().catch(() => null)
  const orderId     = String(body?.orderId     ?? "").trim()
  const txSignature = String(body?.txSignature ?? "").trim()

  if (!orderId || !txSignature) {
    return NextResponse.json({ error: "orderId and txSignature required" }, { status: 400 })
  }

  const order = await getOrderById(orderId)
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
  if (order.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (order.status === "paid" || order.status === "delivered") {
    return NextResponse.json({ ok: true, alreadyPaid: true })
  }
  if (order.status !== "awaiting_payment") {
    return NextResponse.json({ error: "Order is not awaiting payment" }, { status: 409 })
  }

  // Check quote hasn't expired
  if (order.quote_expires_at && isQuoteExpired(order.quote_expires_at)) {
    return NextResponse.json(
      { error: "Quote expired. Please request a new quote." },
      { status: 422 }
    )
  }

  const rpcUrl   = process.env.STORE_SOLANA_RPC_URL
  const treasury = process.env.STORE_SOL_TREASURY_ADDRESS
  if (!rpcUrl || !treasury) {
    return NextResponse.json({ error: "Solana RPC not configured" }, { status: 503 })
  }

  // Fetch transaction from mainnet
  const connection = new Connection(rpcUrl, "confirmed")
  let tx: Awaited<ReturnType<Connection["getParsedTransaction"]>> | null = null
  try {
    tx = await connection.getParsedTransaction(txSignature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    })
  } catch (e) {
    return NextResponse.json({ error: `RPC error: ${String(e)}` }, { status: 502 })
  }

  if (!tx) {
    return NextResponse.json(
      { ok: false, pending: true, message: "Transaction not yet confirmed. Please wait and try again." },
      { status: 202 }
    )
  }

  // Transaction must have succeeded
  if (tx.meta?.err) {
    return NextResponse.json(
      { error: "Transaction failed on-chain" },
      { status: 422 }
    )
  }

  const isSol  = order.crypto_currency === "SOL"
  const isUsdc = order.crypto_currency === "USDC"
  const quotedAmount = order.crypto_amount ?? "0"
  const treasuryPk   = new PublicKey(treasury)

  let verified = false

  if (isSol) {
    // Verify SOL transfer: check post/pre balance difference for treasury account
    const accountKeys = tx.transaction.message.accountKeys.map((k) =>
      typeof k === "string" ? k : k.pubkey.toBase58()
    )
    const treasuryIdx = accountKeys.findIndex((k) => k === treasury)

    if (treasuryIdx >= 0 && tx.meta?.postBalances && tx.meta?.preBalances) {
      const receivedLamports =
        tx.meta.postBalances[treasuryIdx] - tx.meta.preBalances[treasuryIdx]
      const receivedSol = receivedLamports / LAMPORTS_PER_SOL
      verified = amountWithinTolerance(quotedAmount, String(receivedSol))
    }
  }

  if (isUsdc) {
    const usdcMint = process.env.STORE_USDC_MINT
    if (!usdcMint) {
      return NextResponse.json({ error: "USDC mint not configured" }, { status: 503 })
    }

    // Derive the treasury's Associated Token Account (ATA) address
    // We check that the token transfer destination's owner is the treasury.
    // postTokenBalances gives us the owner and mint of each token account post-tx.
    const postBalances = tx.meta?.postTokenBalances ?? []

    for (const tb of postBalances) {
      if (tb.mint !== usdcMint) continue
      if (tb.owner !== treasury) continue // must go to treasury's wallet, not just any ATA

      const receivedUsdc = tb.uiTokenAmount?.uiAmountString ?? "0"
      // Check if this is an increase in balance (not a pre-existing balance)
      const preBalances = tx.meta?.preTokenBalances ?? []
      const preTb = preBalances.find((p) => p.accountIndex === tb.accountIndex)
      const preBal  = parseFloat(preTb?.uiTokenAmount?.uiAmountString ?? "0")
      const postBal = parseFloat(receivedUsdc)
      const received = (postBal - preBal).toFixed(6)

      if (amountWithinTolerance(quotedAmount, received)) {
        verified = true
        break
      }
    }
  }

  if (!verified) {
    return NextResponse.json(
      { error: "Payment amount or destination does not match the order" },
      { status: 422 }
    )
  }

  // Mark paid (idempotent)
  const wasNew = await markOrderPaid({
    orderId,
    externalPaymentId: txSignature,
    githubUsername:    order.github_username ?? undefined,
  })

  if (!wasNew) {
    return NextResponse.json({ ok: true, alreadyPaid: true })
  }

  // Trigger delivery
  const delivery = await deliverBlock(orderId)

  // Send delivery email (non-fatal)
  if (!delivery.needsGithubUsername && session.user.email) {
    const db = getAdminClient()
    const { data: user } = await db
      .from("ms_users")
      .select("github_login, name")
      .eq("id", session.user.id)
      .single()

    if (user?.github_login) {
      const repos = getRepoForBlock(order.block_id)
      await sendDeliveryEmail({
        to:            session.user.email,
        buyerName:     user.name ?? "",
        blockName:     order.block_name,
        blockSlug:     order.block_id,
        githubUsername: user.github_login,
        repoUrls:      repos,
      }).catch(() => {/* non-fatal */})
    }
  }

  return NextResponse.json({
    ok:                  true,
    delivered:           delivery.delivered,
    needsGithubUsername: delivery.needsGithubUsername,
  })
}
