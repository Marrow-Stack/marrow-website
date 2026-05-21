import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { getOrderById, markOrderPaid } from "@/lib/orders"
import { deliverBlock, getRepoForBlock } from "@/lib/github"
import { sendDeliveryEmail } from "@/lib/email"
import { isQuoteExpired, amountWithinTolerance } from "@/lib/price"
import { getAdminClient } from "@/lib/supabase"
import { safeLog } from "@/lib/log"
import { limits, getIp } from "@/lib/ratelimit"
import { rateLimitExceeded, readBody } from "@/lib/api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// USDC token program
const _TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"

export async function POST(req: NextRequest) {
  const ip = getIp(req)
  const rl = await limits.checkout(ip)
  if (!rl.ok) return rateLimitExceeded()

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Unauthenticated" } }, { status: 401 })
  }

  const body        = await readBody<{ orderId?: string; txSignature?: string }>(req)
  const orderId     = String(body?.orderId     ?? "").trim()
  const txSignature = String(body?.txSignature ?? "").trim()

  if (!orderId || !txSignature) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "orderId and txSignature required" } }, { status: 400 })
  }

  const order = await getOrderById(orderId)
  if (!order) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Order not found" } }, { status: 404 })
  if (order.user_id !== session.user.id) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Forbidden" } }, { status: 403 })
  }
  if (order.status === "paid" || order.status === "delivered") {
    return NextResponse.json({ ok: true, alreadyPaid: true })
  }
  if (order.status !== "awaiting_payment") {
    return NextResponse.json({ error: { code: "INVALID_STATE", message: "Order is not awaiting payment" } }, { status: 409 })
  }

  if (order.quote_expires_at && isQuoteExpired(order.quote_expires_at)) {
    return NextResponse.json(
      { error: { code: "QUOTE_EXPIRED", message: "Quote expired. Please request a new quote." } },
      { status: 422 }
    )
  }

  const rpcUrl   = process.env.STORE_SOLANA_RPC_URL
  const treasury = process.env.STORE_SOL_TREASURY_ADDRESS
  if (!rpcUrl || !treasury) {
    return NextResponse.json({ error: { code: "CONFIG_ERROR", message: "Solana RPC not configured" } }, { status: 503 })
  }

  // Use 'finalized' commitment for payment verification — correct, not just 'confirmed'
  const connection = new Connection(rpcUrl, "finalized")
  let tx: Awaited<ReturnType<Connection["getParsedTransaction"]>> | null = null
  try {
    tx = await connection.getParsedTransaction(txSignature, {
      maxSupportedTransactionVersion: 0,
      commitment: "finalized",
    })
  } catch (e) {
    safeLog.error("[solana-verify] RPC error:", e)
    return NextResponse.json({ error: { code: "RPC_ERROR", message: `RPC error: ${String(e)}` } }, { status: 502 })
  }

  if (!tx) {
    return NextResponse.json(
      { ok: false, pending: true, message: "Transaction not yet finalized. Please wait and try again." },
      { status: 202 }
    )
  }

  if (tx.meta?.err) {
    return NextResponse.json(
      { error: { code: "TX_FAILED", message: "Transaction failed on-chain" } },
      { status: 422 }
    )
  }

  const isSol  = order.crypto_currency === "SOL"
  const isUsdc = order.crypto_currency === "USDC"
  const quotedAmount = order.crypto_amount ?? "0"

  let verified = false

  if (isSol) {
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
      return NextResponse.json({ error: { code: "CONFIG_ERROR", message: "USDC mint not configured" } }, { status: 503 })
    }

    const postBalances = tx.meta?.postTokenBalances ?? []
    for (const tb of postBalances) {
      if (tb.mint !== usdcMint) continue
      if (tb.owner !== treasury) continue

      const preBalances = tx.meta?.preTokenBalances ?? []
      const preTb  = preBalances.find((p) => p.accountIndex === tb.accountIndex)
      const preBal = parseFloat(preTb?.uiTokenAmount?.uiAmountString ?? "0")
      const postBal = parseFloat(tb.uiTokenAmount?.uiAmountString ?? "0")
      const received = (postBal - preBal).toFixed(6)

      if (amountWithinTolerance(quotedAmount, received)) {
        verified = true
        break
      }
    }
  }

  if (!verified) {
    return NextResponse.json(
      { error: { code: "PAYMENT_MISMATCH", message: "Payment amount or destination does not match the order" } },
      { status: 422 }
    )
  }

  const wasNew = await markOrderPaid({
    orderId,
    externalPaymentId: txSignature,
    githubUsername:    order.github_username ?? undefined,
  })

  if (!wasNew) {
    return NextResponse.json({ ok: true, alreadyPaid: true })
  }

  const delivery = await deliverBlock(orderId)

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
