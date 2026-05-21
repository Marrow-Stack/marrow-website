import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { deliverBlock, getRepoForBlock } from "@/lib/github"
import { getOrderById } from "@/lib/orders"
import { sendDeliveryEmail } from "@/lib/email"

// POST /api/delivery/redeliver
// Body: { orderId: string }
// Safe to call multiple times — delivery is idempotent.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const orderId = String(body?.orderId ?? "").trim()
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 })
  }

  // Verify the order belongs to this user
  const order = await getOrderById(orderId)
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
  if (order.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (order.status !== "paid" && order.status !== "delivered") {
    return NextResponse.json({ error: "Order not paid" }, { status: 409 })
  }

  const result = await deliverBlock(orderId)

  if (result.needsGithubUsername) {
    return NextResponse.json({
      ok: false,
      needsGithubUsername: true,
      message: "We need your GitHub username before we can deliver.",
    })
  }

  if (!result.delivered && result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
  }

  // Send email if delivery succeeded and we have the buyer's email
  if (result.delivered && session.user.email && order.github_username) {
    const repos = getRepoForBlock(order.block_id)
    await sendDeliveryEmail({
      to:            session.user.email,
      buyerName:     session.user.name ?? "",
      blockName:     order.block_name,
      blockSlug:     order.block_id,
      githubUsername: order.github_username,
      repoUrls:      repos,
    }).catch(() => {/* non-fatal */})
  }

  return NextResponse.json({ ok: true, delivered: result.delivered })
}
