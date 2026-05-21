import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createOrder, setOrderAwaitingPayment, hasUserPurchasedBlock } from "@/lib/orders"
import { getBlock } from "@/lib/blocks-data"
import { createCheckoutSession } from "@/lib/dodopayments"

// DODO_PRODUCT_ID_{BLOCK_ID_UPPER} → the product_id set in the Dodo dashboard.
// The price lives in Dodo — we never send an amount, just the product.
function getDodoProductId(blockId: string): string | undefined {
  const key = `DODO_PRODUCT_ID_${blockId.toUpperCase().replace(/-/g, "_")}`
  return process.env[key]
}

// POST /api/checkout/dodo
// Body: { blockId: string }
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 })
  }

  const body    = await req.json().catch(() => null)
  const blockId = String(body?.blockId ?? "").trim()
  if (!blockId) {
    return NextResponse.json({ error: "blockId required" }, { status: 400 })
  }

  const block = getBlock(blockId)
  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 })
  }

  const userId = session.user.id

  // Prevent double-purchase
  const alreadyOwns = await hasUserPurchasedBlock(userId, blockId)
  if (alreadyOwns) {
    return NextResponse.json({ error: "You already own this block." }, { status: 400 })
  }

  const productId = getDodoProductId(blockId)
  if (!productId) {
    return NextResponse.json(
      { error: `No Dodo product configured for block '${blockId}'. Set DODO_PRODUCT_ID_${blockId.toUpperCase().replace(/-/g, "_")} in env.` },
      { status: 503 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://marrowstack.dev"

  // 1. Create order record
  const order = await createOrder({
    userId,
    blockId:   block.id,
    blockName: block.name,
    amountUsd: block.price,
  })

  // 2. Create Dodo checkout session
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
    console.error("[dodo-checkout] error:", err)
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }

  // 3. Record the Dodo payment_id so the webhook can find this order
  await setOrderAwaitingPayment(order.id, "dodo", paymentId)

  return NextResponse.json({ checkoutUrl })
}
