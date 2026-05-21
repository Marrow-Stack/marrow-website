import { NextRequest, NextResponse } from "next/server"
import { verifyDodoWebhook } from "@/lib/dodopayments"
import { getOrderById, getOrderByExternalPaymentId, markOrderPaid } from "@/lib/orders"
import { deliverBlock, getRepoForBlock } from "@/lib/github"
import { sendDeliveryEmail } from "@/lib/email"
import { getAdminClient } from "@/lib/supabase"

// Dodo Payments webhook handler.
// Signature spec: standardwebhooks (webhook-id / webhook-signature / webhook-timestamp headers).
// Delivery is triggered HERE — by server-verified webhook — never by client redirect.

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  const valid = await verifyDodoWebhook(rawBody, {
    "webhook-id":        req.headers.get("webhook-id")        ?? "",
    "webhook-signature": req.headers.get("webhook-signature") ?? "",
    "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
  })

  if (!valid) {
    console.warn("[dodo-webhook] Invalid signature")
    return new NextResponse("Unauthorized", { status: 401 })
  }

  let event: { type: string; data: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 })
  }

  const type = event.type
  console.log(`[dodo-webhook] ${type}`)

  try {
    if (type === "payment.succeeded") {
      const payment   = event.data
      const paymentId = String(payment.payment_id ?? payment.id ?? "")

      // Metadata keys are prefixed with "metadata_" by our createCheckoutSession helper.
      // Dodo may strip or keep the prefix depending on version — check both.
      const meta = (payment.metadata ?? {}) as Record<string, string>
      const orderId = meta["metadata_orderId"] || meta["orderId"] || ""
      const blockId = meta["metadata_blockId"] || meta["blockId"] || ""
      const userId  = meta["metadata_userId"]  || meta["userId"]  || ""

      if (!paymentId) {
        console.error("[dodo-webhook] Missing payment_id in event", payment)
        return new NextResponse("Missing payment_id", { status: 422 })
      }

      // Idempotency — reject if already processed
      const existingByPayment = await getOrderByExternalPaymentId(paymentId)
      if (existingByPayment) {
        return new NextResponse("Already processed", { status: 200 })
      }

      // Resolve the order: prefer orderId from metadata, fall back to blockId + userId lookup
      let order = orderId ? await getOrderById(orderId) : null

      if (!order && blockId && userId) {
        // Fallback: find the most recent awaiting_payment order for this user+block
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
        console.error("[dodo-webhook] Order not found", { orderId, blockId, userId })
        return new NextResponse("Order not found", { status: 404 })
      }

      // Mark paid (idempotent)
      const wasNew = await markOrderPaid({ orderId: order.id, externalPaymentId: paymentId })
      if (!wasNew) {
        return new NextResponse("Already paid", { status: 200 })
      }

      // Deliver
      const delivery = await deliverBlock(order.id)

      // Send email (non-fatal)
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
          }).catch((e) => console.warn("[dodo-webhook] email error:", e))
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
      }
    }
  } catch (err) {
    console.error("[dodo-webhook] Error:", err)
  }

  return new NextResponse("OK", { status: 200 })
}
