import { NextRequest, NextResponse } from "next/server"
import { verifyDodoWebhook } from "@/lib/dodopayments"
import { getOrderById, getOrderByExternalPaymentId, markOrderPaid } from "@/lib/orders"
import { deliverBlock, getRepoForBlock } from "@/lib/github"
import { sendDeliveryEmail } from "@/lib/email"
import { getAdminClient } from "@/lib/supabase"
import { safeLog } from "@/lib/log"
import { limits, getIp } from "@/lib/ratelimit"
import { rateLimitExceeded } from "@/lib/api"

// Webhook routes must never be cached or run on edge.
// Signature verification libraries require Node.js crypto primitives.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const MAX_BODY_BYTES = 1024 * 1024 // 1 MB

export async function POST(req: NextRequest) {
  // Rate limit by IP to prevent webhook flooding
  const ip = getIp(req)
  const rl = await limits.webhook(ip)
  if (!rl.ok) return rateLimitExceeded()

  // Body size guard before reading
  const contentLength = req.headers.get("content-length")
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return new NextResponse("Payload too large", { status: 413 })
  }

  const rawBody = await req.text()
  if (rawBody.length > MAX_BODY_BYTES) {
    return new NextResponse("Payload too large", { status: 413 })
  }

  const valid = await verifyDodoWebhook(rawBody, {
    "webhook-id":        req.headers.get("webhook-id")        ?? "",
    "webhook-signature": req.headers.get("webhook-signature") ?? "",
    "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
  })

  if (!valid) {
    // Log nothing about the body — signature mismatch may indicate probing
    safeLog.warn("[dodo-webhook] Invalid signature from", ip)
    return new NextResponse("Unauthorized", { status: 401 })
  }

  let event: { type: string; data: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 })
  }

  const type = event.type
  safeLog.log(`[dodo-webhook] ${type}`)

  try {
    if (type === "payment.succeeded") {
      const payment   = event.data
      const paymentId = String(payment.payment_id ?? payment.id ?? "")

      const meta = (payment.metadata ?? {}) as Record<string, string>
      const orderId = meta["metadata_orderId"] || meta["orderId"] || ""
      const blockId = meta["metadata_blockId"] || meta["blockId"] || ""
      const userId  = meta["metadata_userId"]  || meta["userId"]  || ""

      if (!paymentId) {
        safeLog.error("[dodo-webhook] Missing payment_id in event")
        return new NextResponse("Missing payment_id", { status: 422 })
      }

      // Idempotency — no-op if already processed
      const existingByPayment = await getOrderByExternalPaymentId(paymentId)
      if (existingByPayment) {
        return new NextResponse("Already processed", { status: 200 })
      }

      let order = orderId ? await getOrderById(orderId) : null

      if (!order && blockId && userId) {
        const db = getAdminClient()
        const { data } = await db
          .from("ms_orders")
          .select()
          .eq("user_id", userId)
          .eq("block_id", blockId)
          .eq("status", "awaiting_payment")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
        order = data ?? null
      }

      if (!order) {
        safeLog.error("[dodo-webhook] Order not found", { orderId, blockId, userId: "[redacted]" })
        return new NextResponse("Order not found", { status: 404 })
      }

      const wasNew = await markOrderPaid({ orderId: order.id, externalPaymentId: paymentId })
      if (!wasNew) {
        return new NextResponse("Already paid", { status: 200 })
      }

      const delivery = await deliverBlock(order.id)

      if (!delivery.needsGithubUsername) {
        const db = getAdminClient()
        const { data: user } = await db
          .from("ms_users")
          .select("email, name, github_login")
          .eq("id", order.user_id)
          .single()

        if (user?.email && user?.github_login) {
          const repos = getRepoForBlock(order.block_id)
          sendDeliveryEmail({
            to:             user.email,
            buyerName:      user.name ?? "",
            blockName:      order.block_name,
            blockSlug:      order.block_id,
            githubUsername: user.github_login,
            repoUrls:       repos,
          }).catch((e) => safeLog.warn("[dodo-webhook] email error:", e))
        }
      }
    }

    if (type === "refund.succeeded") {
      const paymentId = String(event.data?.payment_id ?? "")
      if (paymentId) {
        const db = getAdminClient()
        await db
          .from("ms_orders")
          .update({ status: "refunded" })
          .eq("external_payment_id", paymentId)
        // Access policy: refunds do not revoke code access.
        // Buyer retains repo collaborator access after refund.
        // See DECISIONS.md for the refund policy.
        safeLog.log("[dodo-webhook] Order refunded, access retained:", paymentId)
      }
    }
  } catch (err) {
    safeLog.error("[dodo-webhook] Error:", err)
  }

  return new NextResponse("OK", { status: 200 })
}
