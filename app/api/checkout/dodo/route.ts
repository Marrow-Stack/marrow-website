import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createOrder, setOrderAwaitingPayment, hasUserPurchasedBlock } from "@/lib/orders"
import { getBlock } from "@/lib/blocks-data"
import { createCheckoutSession } from "@/lib/dodopayments"
import { safeLog } from "@/lib/log"
import { limits, getIp } from "@/lib/ratelimit"
import { maintenanceGuard, rateLimitExceeded, readBody } from "@/lib/api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// DODO_PRODUCT_ID_{BLOCK_ID_UPPER} → the product_id set in the Dodo dashboard.
function getDodoProductId(blockId: string): string | undefined {
  const key = `DODO_PRODUCT_ID_${blockId.toUpperCase().replace(/-/g, "_")}`
  return process.env[key]
}

export async function POST(req: NextRequest) {
  const maintenance = maintenanceGuard()
  if (maintenance) return maintenance

  const ip = getIp(req)
  const rl = await limits.checkout(ip)
  if (!rl.ok) return rateLimitExceeded()

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Sign in required" } }, { status: 401 })
  }

  const body    = await readBody<{ blockId?: string }>(req)
  const blockId = String(body?.blockId ?? "").trim()
  if (!blockId) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "blockId required" } }, { status: 400 })
  }

  const block = getBlock(blockId)
  if (!block) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Block not found" } }, { status: 404 })
  }

  const userId = session.user.id

  const alreadyOwns = await hasUserPurchasedBlock(userId, blockId)
  if (alreadyOwns) {
    return NextResponse.json({ error: { code: "ALREADY_OWNED", message: "You already own this block." } }, { status: 400 })
  }

  const productId = getDodoProductId(blockId)
  if (!productId) {
    return NextResponse.json(
      { error: { code: "NO_PRODUCT", message: `No Dodo product configured for '${blockId}'.` } },
      { status: 503 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://marrowstack.dev"

  const order = await createOrder({
    userId,
    blockId:   block.id,
    blockName: block.name,
    amountUsd: block.price,
  })

  let checkoutUrl: string
  let paymentId:   string
  try {
    const checkout = await createCheckoutSession({
      productId,
      customerEmail: session.user.email ?? "",
      customerName:  session.user.name  ?? "Developer",
      returnUrl:     `${appUrl}/checkout/success?orderId=${order.id}`,
      metadata: {
        orderId: order.id,
        blockId: block.id,
        userId,
      },
    })
    checkoutUrl = checkout.checkout_url
    paymentId   = checkout.payment_id
  } catch (err) {
    safeLog.error("[dodo-checkout] error:", err)
    return NextResponse.json({ error: { code: "GATEWAY_ERROR", message: "Payment provider error." } }, { status: 502 })
  }

  await setOrderAwaitingPayment(order.id, "dodo", paymentId)

  return NextResponse.json({ checkoutUrl })
}
